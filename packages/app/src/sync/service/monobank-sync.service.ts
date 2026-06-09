/* eslint-disable no-await-in-loop, lingui/no-unlocalized-strings, max-lines -- Sync orchestration requires sequential awaits and many log tags */
import { MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { consolidationScopeService } from '@budgie/consolidation';
import { BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { applyBankSyncProgressUpdate } from '../util/apply-bank-sync-progress-update.util';
import { createOrUpdateBankSync } from '../util/create-or-update-bank-sync.util';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';
import { runBankSyncLoop } from '../util/run-bank-sync-loop.util';

import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { BankAccountInterface, BankSyncBatchResultInterface } from '@budgie/bank-sync';
import type {
    AccountEntityInterface,
    BankSyncEntityInterface,
    MccCategoryLookupInterface,
    TransactionEntityInterface
} from '@budgie/contracts';

const logger = getLogger('AppMonobankSyncService');

class AppMonobankSyncService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;
    private static readonly FORWARD_SYNC_STALE_THRESHOLD_MS = TWO_MINUTES_IN_SECONDS * 1000;

    readonly supportsTokenAuth = true;

    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;
    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        const startedAt = Date.now();
        if (this.isRunning) {
            logger.log('sync:skip', { reason: 'already-running' });

            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        try {
            await this.loadMccCategories();

            return await this.executeSyncLoop();
        } finally {
            logger.log('sync:done', { durationMs: Date.now() - startedAt });
            this.isRunning = false;
        }
    }

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} externalIds=${result.map(account => account.externalId).join(',')}`,
        (error, token) => `throw tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async fetchAccountsPreview(token: string): Promise<BankAccountPreviewInterface[]> {
        const bankAccounts = await this.fetchBankAccountsAndJars(token);
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return mapBankAccountsToPreview(bankAccounts, this.provider);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK)) {
            await BackgroundTask.unregisterTaskAsync(MONOBANK_SYNC_TASK);
        }
        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, {
            minimumInterval: AppMonobankSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log(
        'enter',
        result =>
            `done totalMccCount=${result.size} withDefaultCount=${[...result.values()].filter(value => isDefined(value.defaultCategoryId)).length}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async loadMccCategories(): Promise<Map<string, MccCategoryLookupInterface>> {
        this.mccCategoryLookupMap = await loadMccCategoryLookupMap();

        return this.mccCategoryLookupMap;
    }

    @Log('enter', result => `done result=${result}`, error => `throw error=${getErrorMessage(error)}`)
    private async executeSyncLoop(): Promise<BackgroundTask.BackgroundTaskResult> {
        return runBankSyncLoop(this.provider, MONOBANK_RATE_LIMIT_MS, () => this.processPendingSyncs());
    }

    @Log('enter', result => `done found=${isDefined(result)}`, error => `throw error=${getErrorMessage(error)}`)
    private async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSync = await this.findNextBackwardSync();
        if (isDefined(backwardSync)) {
            return backwardSync;
        }

        return this.findNextForwardSync();
    }

    @Log('enter', result => `done found=${isDefined(result)}`, error => `throw error=${getErrorMessage(error)}`)
    private async findNextBackwardSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSyncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (!isNotEmptyArray(backwardSyncs)) {
            return null;
        }

        await bankSyncRepository.setStatus(backwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

        return backwardSyncs[0];
    }

    @Log('enter', result => `done found=${isDefined(result)}`, error => `throw error=${getErrorMessage(error)}`)
    private async findNextForwardSync(): Promise<BankSyncEntityInterface | null> {
        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(
            this.provider,
            AppMonobankSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        if (!isNotEmptyArray(forwardSyncs)) {
            return null;
        }

        await bankSyncRepository.setStatus(forwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

        return forwardSyncs[0];
    }

    @Log(
        (sync, result) =>
            `enter syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} transactionIds=${result.transactions
                .slice(0, 5)
                .map(transaction => transaction.id)
                .join(',')} completed=${result.completed}`,
        (doneResult, sync, result) =>
            `done result=${String(doneResult)} syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} transactionIds=${result.transactions
                .slice(0, 5)
                .map(transaction => transaction.id)
                .join(',')} completed=${result.completed}`,
        (error, sync, result) =>
            `throw syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} transactionIds=${result.transactions
                .slice(0, 5)
                .map(transaction => transaction.id)
                .join(',')} error=${getErrorMessage(error)}`
    )
    private async updateSyncProgress(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        const startedAt = Date.now();
        await applyBankSyncProgressUpdate(sync, result);
        logger.log('updateSyncProgress:duration', {
            completed: result.completed,
            durationMs: Date.now() - startedAt,
            mode: sync.mode,
            syncId: sync.id,
            transactionCount: result.transactions.length
        });
    }

    @Log(
        sync => `enter syncId=${sync.id} mode=${sync.mode}`,
        (result, sync) =>
            `done syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} transactionIds=${result.transactions
                .slice(0, 5)
                .map(transaction => transaction.id)
                .join(',')} completed=${result.completed}`,
        (error, sync) => `throw syncId=${sync.id} mode=${sync.mode} error=${getErrorMessage(error)}`
    )
    // eslint-disable-next-line max-statements -- Sync batch keeps adjacent phase timing logs for live performance debugging
    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const startedAt = Date.now();
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            logger.log('executeSyncBatch:missing-account', {
                accountId: sync.accountId,
                durationMs: Date.now() - startedAt,
                syncId: sync.id
            });

            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const fetchStartedAt = Date.now();
        const result = await this.fetchTransactionBatch(sync, account.externalId);
        logger.log('executeSyncBatch:fetch', {
            completed: result.completed,
            durationMs: Date.now() - fetchStartedAt,
            mode: sync.mode,
            syncId: sync.id,
            transactionCount: result.transactions.length
        });
        await microPause();

        const processStartedAt = Date.now();
        const changedTransactions = await this.processFetchedTransactions(result.transactions, account.id);
        const changedTransactionCount = changedTransactions.length;
        logger.log('executeSyncBatch:process', {
            accountId: account.id,
            changedTransactionCount,
            durationMs: Date.now() - processStartedAt,
            syncId: sync.id,
            transactionCount: result.transactions.length
        });

        if (isPositiveNumber(changedTransactionCount)) {
            const scope = consolidationScopeService.buildFromTransactions(changedTransactions);
            if (isDefined(scope)) {
                transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, scope);
                logger.log('executeSyncBatch:consolidation-enqueued', {
                    changedTransactionCount,
                    scopeTransactionIds: scope.transactionIds.join(','),
                    syncId: sync.id
                });
            }
        }

        await microPause();
        logger.log('executeSyncBatch:done', { durationMs: Date.now() - startedAt, syncId: sync.id });

        return result;
    }

    @Log(
        (transactions, existingTransactionIdMap) =>
            `enter transactionIds=${transactions.map(transaction => transaction.id).join(',')} existingExternalIds=${[...existingTransactionIdMap.keys()].join(',')}`,
        (result, transactions, existingTransactionIdMap) =>
            `done transactionIds=${transactions.map(transaction => transaction.id).join(',')} existingExternalIds=${[...existingTransactionIdMap.keys()].join(',')} scopeTransactionIds=${result.map(transaction => transaction.id).join(',')}`,
        (error, transactions, existingTransactionIdMap) =>
            `throw transactionIds=${transactions.map(transaction => transaction.id).join(',')} existingExternalIds=${[...existingTransactionIdMap.keys()].join(',')} error=${getErrorMessage(error)}`
    )
    private buildExistingTransactionScopeSeeds(
        transactions: BankSyncBatchResultInterface['transactions'],
        existingTransactionIdMap: Map<string, number>
    ): Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[] {
        return transactions.flatMap(transaction => {
            const id = existingTransactionIdMap.get(transaction.id);
            if (!isDefined(id)) {
                return [];
            }

            return [{ id, operatedAt: new Date(transaction.time * 1000) }];
        });
    }

    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<void> {
        const bankAccounts = await this.fetchBankAccountsAndJars(token);

        for (const externalId of externalIds) {
            const bankAccount = bankAccounts.find(acc => acc.id === externalId);
            if (isDefined(bankAccount)) {
                const account = await this.getOrCreateAccount(bankAccount);
                await createOrUpdateBankSync(account.id, token, this.provider);
            }
        }

        void this.registerBackgroundTask();
        void this.sync();
    }

    async updateAccountToken(accountId: number, token: string): Promise<void> {
        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            throw new Error('Bank sync not found');
        }
        await bankSyncRepository.update(bankSync.id, { token, errorCount: 0, lastError: null });
    }

    async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await bankSyncRepository.setEnabled(accountId, enabled);
        if (enabled) {
            void this.sync();
        }
    }

    private async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const startedAt = Date.now();
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            logger.log('processPendingSyncs:empty', { durationMs: Date.now() - startedAt });

            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const result = await this.executeSyncBatch(pendingSync);
        await this.updateSyncProgress(pendingSync, result);
        logger.log('processPendingSyncs:batch', {
            completed: result.completed,
            durationMs: Date.now() - startedAt,
            mode: pendingSync.mode,
            syncId: pendingSync.id,
            transactionCount: result.transactions.length
        });
        await microPause(MONOBANK_RATE_LIMIT_MS);

        return await this.executeSyncLoop();
    }

    // eslint-disable-next-line max-statements -- Sync import path keeps adjacent phase timing logs for live performance debugging
    private async processFetchedTransactions(
        transactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]> {
        const startedAt = Date.now();
        if (!isNotEmptyArray(transactions)) {
            logger.log('processFetchedTransactions:empty', { accountId, durationMs: Date.now() - startedAt });

            return [];
        }

        const existingStartedAt = Date.now();
        const existingTransactionIdMap = await transactionService.findIdMapByExternalSource(this.provider);
        logger.log('processFetchedTransactions:existing-ids', {
            accountId,
            durationMs: Date.now() - existingStartedAt,
            existingCount: existingTransactionIdMap.size,
            fetchedCount: transactions.length
        });
        const newTransactions = transactions.filter(bankTransaction => !existingTransactionIdMap.has(bankTransaction.id));
        const existingTransactions = transactions.filter(bankTransaction => existingTransactionIdMap.has(bankTransaction.id));
        logger.log('processFetchedTransactions:classified', {
            accountId,
            existingCount: existingTransactions.length,
            fetchedCount: transactions.length,
            newCount: newTransactions.length
        });

        const createdTransactions = await this.createNewTransactions(newTransactions, accountId);
        const updatedTransactionCount = await this.updateExistingTransactions(existingTransactions, accountId);
        const updatedTransactions = this.buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap);

        if (isPositiveNumber(updatedTransactionCount)) {
            const balanceStartedAt = Date.now();
            await transactionService.updateAllBalances();
            logger.log('processFetchedTransactions:balances', {
                accountId,
                durationMs: Date.now() - balanceStartedAt,
                updatedTransactionCount
            });
        }

        logger.log('processFetchedTransactions:done', {
            accountId,
            createdTransactionCount: createdTransactions.length,
            durationMs: Date.now() - startedAt,
            updatedTransactionCount
        });

        return [...createdTransactions, ...updatedTransactions];
    }

    // eslint-disable-next-line max-statements -- Sync create path keeps adjacent phase timing logs for live performance debugging
    private async createNewTransactions(
        newTransactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<TransactionEntityInterface[]> {
        const startedAt = Date.now();
        if (!isNotEmptyArray(newTransactions)) {
            logger.log('createNewTransactions:empty', { accountId, durationMs: Date.now() - startedAt });

            return [];
        }

        const inputs = newTransactions.map(bankTransaction => {
            const lookup = this.mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null;

            return mapBankTransactionToCreateInput(bankTransaction, accountId, lookup, this.provider);
        });
        const prepareStartedAt = Date.now();
        const prepared = await ruleEngineService.prepareCreateInputsForRules(inputs);
        logger.log('createNewTransactions:rules', {
            accountId,
            durationMs: Date.now() - prepareStartedAt,
            inputCount: inputs.length,
            postCreateCount: prepared.postCreateIndexes.length
        });
        const createStartedAt = Date.now();
        const createdTransactions = await transactionService.bulkCreate(prepared.transactionInputs);
        logger.log('createNewTransactions:bulk-create', {
            accountId,
            createdCount: createdTransactions.length,
            durationMs: Date.now() - createStartedAt
        });
        const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (isNotEmptyArray(postCreateTransactionIds)) {
            ruleApplicationDrainerService.enqueueTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }
        logger.log('createNewTransactions:done', {
            accountId,
            createdCount: createdTransactions.length,
            durationMs: Date.now() - startedAt,
            postCreateCount: postCreateTransactionIds.length
        });

        return createdTransactions;
    }

    private async updateExistingTransactions(
        existingTransactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<number> {
        const startedAt = Date.now();
        if (!isNotEmptyArray(existingTransactions)) {
            logger.log('updateExistingTransactions:empty', { accountId, durationMs: Date.now() - startedAt });

            return 0;
        }

        for (const bankTransaction of existingTransactions) {
            await transactionService.update(mapBankTransactionToCreateInput(bankTransaction, accountId, null, this.provider));
            await microPause();
        }
        logger.log('updateExistingTransactions:done', {
            accountId,
            durationMs: Date.now() - startedAt,
            updatedCount: existingTransactions.length
        });

        return existingTransactions.length;
    }

    private async fetchTransactionBatch(sync: BankSyncEntityInterface, extAccId: string): Promise<BankSyncBatchResultInterface> {
        const startedAt = Date.now();
        const svc = new MonobankSyncService(sync.token);
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;

        const result = isForward
            ? await svc.syncTransactionsForward(extAccId, sync.forwardSyncFromAt ?? new Date())
            : await svc.syncTransactionsBackward(extAccId, sync.backwardSyncFromAt ?? new Date(), sync.backwardSyncedAt);
        logger.log('fetchTransactionBatch:done', {
            completed: result.completed,
            durationMs: Date.now() - startedAt,
            mode: sync.mode,
            syncId: sync.id,
            transactionCount: result.transactions.length
        });

        return result;
    }

    private async fetchBankAccountsAndJars(token: string): Promise<BankAccountInterface[]> {
        const service = new MonobankSyncService(token);
        const accounts = await service.syncAccounts();
        const jars = await service.syncJars();

        return [...accounts, ...jars];
    }

    private async getOrCreateAccount(bankAccount: BankAccountInterface): Promise<AccountEntityInterface> {
        return getOrCreateBankAccount(bankAccount, this.provider);
    }
}

export const monobankSyncService = new AppMonobankSyncService();
