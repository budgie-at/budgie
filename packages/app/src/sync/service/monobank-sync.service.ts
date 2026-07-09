/* eslint-disable no-await-in-loop, lingui/no-unlocalized-strings -- Sync orchestration requires sequential bank API work and background state */
import { MONOBANK_RATE_LIMIT_MS, MonobankSyncService, mapBankTransactionToCreateInput } from '@budgie/bank-sync';
import { consolidationScopeService } from '@budgie/consolidation';
import { BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';

import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { BankAccountInterface, BankSyncBatchResultInterface } from '@budgie/bank-sync';
import type {
    AccountEntityInterface,
    BankSyncEntityInterface,
    MccCategoryLookupInterface,
    TransactionEntityInterface
} from '@budgie/contracts';

class AppMonobankSyncService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;
    private static readonly FORWARD_SYNC_STALE_THRESHOLD_MS = 120000;

    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;
    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();
    private readonly processedForwardSyncIds = new Set<number>();

    @Log('enter', result => `done result=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        this.processedForwardSyncIds.clear();
        try {
            await this.loadMccCategories();

            return await this.executeSyncLoop();
        } finally {
            this.processedForwardSyncIds.clear();
            this.isRunning = false;
        }
    }

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} accountCount=${result.length}`,
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
        (token, externalIds) => `enter tokenLen=${token.length} externalIdCount=${externalIds.length}`,
        (_result, token, externalIds) => `done tokenLen=${token.length} externalIdCount=${externalIds.length}`,
        (error, token, externalIds) =>
            `throw tokenLen=${token.length} externalIdCount=${externalIds.length} error=${getErrorMessage(error)}`
    )
    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<void> {
        const bankAccounts = await this.fetchBankAccountsAndJars(token);

        for (const externalId of externalIds) {
            const bankAccount = bankAccounts.find(candidateBankAccount => candidateBankAccount.id === externalId);
            if (isDefined(bankAccount)) {
                const account = await this.getOrCreateAccount(bankAccount);
                await this.createOrUpdateBankSync(account.id, token);
            }
        }

        void this.registerBackgroundTask();
        void this.sync();
    }

    @Log(
        (accountId, token) => `enter accountId=${accountId} tokenLen=${token.length}`,
        (_result, accountId, token) => `done accountId=${accountId} tokenLen=${token.length}`,
        (error, accountId, token) => `throw accountId=${accountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async updateAccountToken(accountId: number, token: string): Promise<void> {
        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            throw new Error('Bank sync not found');
        }
        await bankSyncRepository.update(bankSync.id, { token, errorCount: 0, lastError: null });
    }

    @Log(
        (accountId, enabled) => `enter accountId=${accountId} enabled=${enabled}`,
        (_result, accountId, enabled) => `done accountId=${accountId} enabled=${enabled}`,
        (error, accountId, enabled) => `throw accountId=${accountId} enabled=${enabled} error=${getErrorMessage(error)}`
    )
    async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await bankSyncRepository.setEnabled(accountId, enabled);
        if (enabled) {
            void this.sync();
        }
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
        try {
            const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
            if (!isNotEmptyArray(enabledSyncs)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            return await this.processPendingSyncs();
        } catch (error: unknown) {
            return await this.handleSyncError(error);
        }
    }

    @Log(
        error => `enter error=${getErrorMessage(error)}`,
        (result, error) => `done error=${getErrorMessage(error)} result=${result}`,
        (thrownError, error) => `throw error=${getErrorMessage(error)} thrownError=${getErrorMessage(thrownError)}`
    )
    private async handleSyncError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        const syncToRetry = enabledSyncs.find(sync => sync.errorCount < SYNC_ERROR_THRESHOLD);
        if (isDefined(syncToRetry)) {
            await bankSyncRepository.recordError(syncToRetry.id, errorMessage);
            await microPause(MONOBANK_RATE_LIMIT_MS);

            return await this.executeSyncLoop();
        }

        for (const sync of enabledSyncs) {
            await bankSyncRepository.update(sync.id, { status: BankSyncStatusEnum.FAILED, lastError: errorMessage, enabled: false });
        }

        return BackgroundTask.BackgroundTaskResult.Failed;
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
        const forwardSync = forwardSyncs.find(sync => !this.processedForwardSyncIds.has(sync.id));
        if (!isDefined(forwardSync)) {
            return null;
        }

        await bankSyncRepository.setStatus(forwardSync.id, BankSyncStatusEnum.SYNCING);

        return forwardSync;
    }

    @Log(
        (sync, result) =>
            `enter syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${result.completed}`,
        (_result, sync, result) =>
            `done syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${result.completed}`,
        (error, sync, result) =>
            `throw syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} error=${getErrorMessage(error)}`
    )
    private async updateSyncProgress(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        const now = new Date();
        const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };
        const nextBackwardSyncedAt = isNotEmptyArray(result.transactions) ? null : (sync.backwardSyncedAt ?? result.nextTo);

        if (result.completed) {
            if (sync.mode === BankSyncModeEnum.FORWARD) {
                await bankSyncRepository.update(sync.id, {
                    ...baseUpdate,
                    status: BankSyncStatusEnum.IDLE,
                    forwardSyncedAt: now,
                    forwardSyncFromAt: now
                });
            } else {
                await bankSyncRepository.update(sync.id, {
                    ...baseUpdate,
                    mode: BankSyncModeEnum.FORWARD,
                    status: BankSyncStatusEnum.IDLE,
                    backwardSyncedAt: result.nextTo,
                    backwardSyncFromAt: result.nextFrom
                });
            }
        } else if (sync.mode === BankSyncModeEnum.BACKWARD) {
            await bankSyncRepository.update(sync.id, {
                ...baseUpdate,
                backwardSyncedAt: nextBackwardSyncedAt,
                backwardSyncFromAt: result.nextTo
            });
        } else {
            await bankSyncRepository.update(sync.id, {
                ...baseUpdate,
                forwardSyncFromAt: result.nextFrom
            });
        }
    }

    @Log(
        sync => `enter syncId=${sync.id} mode=${sync.mode}`,
        (result, sync) =>
            `done syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${result.completed}`,
        (error, sync) => `throw syncId=${sync.id} mode=${sync.mode} error=${getErrorMessage(error)}`
    )
    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const result = await this.fetchTransactionBatch(sync, account.externalId);
        await microPause();

        const changedTransactions = await this.processFetchedTransactions(result.transactions, account.id);
        this.enqueueConsolidationForChangedTransactions(changedTransactions);
        await microPause();

        return result;
    }

    @Log(
        (transactions, accountId) => `enter accountId=${accountId} transactionCount=${transactions.length}`,
        (result, transactions, accountId) =>
            `done accountId=${accountId} transactionCount=${transactions.length} changedTransactionCount=${result.length}`,
        (error, transactions, accountId) =>
            `throw accountId=${accountId} transactionCount=${transactions.length} error=${getErrorMessage(error)}`
    )
    private async processFetchedTransactions(
        transactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]> {
        if (!isNotEmptyArray(transactions)) {
            return [];
        }

        const existingTransactionIdMap = await transactionService.findIdMapByExternalSource(this.provider);
        const newTransactions = transactions.filter(bankTransaction => !existingTransactionIdMap.has(bankTransaction.id));
        const existingTransactions = transactions.filter(bankTransaction => existingTransactionIdMap.has(bankTransaction.id));

        const createdTransactions = await this.createNewTransactions(newTransactions, accountId);
        const updatedTransactionCount = await this.updateExistingTransactions(existingTransactions, accountId);
        const updatedTransactions = this.buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap);

        if (isPositiveNumber(updatedTransactionCount)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        return [...createdTransactions, ...updatedTransactions];
    }

    @Log(
        (newTransactions, accountId) => `enter accountId=${accountId} transactionCount=${newTransactions.length}`,
        (result, newTransactions, accountId) =>
            `done accountId=${accountId} transactionCount=${newTransactions.length} createdTransactionCount=${result.length}`,
        (error, newTransactions, accountId) =>
            `throw accountId=${accountId} transactionCount=${newTransactions.length} error=${getErrorMessage(error)}`
    )
    private async createNewTransactions(
        newTransactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(newTransactions)) {
            return [];
        }

        const inputs = newTransactions.map(bankTransaction => {
            const lookup = this.mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null;

            return mapBankTransactionToCreateInput(bankTransaction, accountId, lookup);
        });
        const prepared = await ruleEngineService.prepareCreateInputsForRules(inputs);
        const createdTransactions = await transactionService.bulkCreate(prepared.transactionInputs);
        const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (isNotEmptyArray(postCreateTransactionIds)) {
            ruleApplicationDrainerService.enqueueTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }

        return createdTransactions;
    }

    @Log(
        (existingTransactions, accountId) => `enter accountId=${accountId} transactionCount=${existingTransactions.length}`,
        (result, existingTransactions, accountId) =>
            `done accountId=${accountId} transactionCount=${existingTransactions.length} updatedTransactionCount=${result}`,
        (error, existingTransactions, accountId) =>
            `throw accountId=${accountId} transactionCount=${existingTransactions.length} error=${getErrorMessage(error)}`
    )
    private async updateExistingTransactions(
        existingTransactions: BankSyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<number> {
        if (!isNotEmptyArray(existingTransactions)) {
            return 0;
        }

        for (const bankTransaction of existingTransactions) {
            await transactionService.update(mapBankTransactionToCreateInput(bankTransaction, accountId, null));
            await microPause();
        }

        return existingTransactions.length;
    }

    @Log(
        (sync, externalAccountId) => `enter syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId}`,
        (result, sync, externalAccountId) =>
            `done syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId} transactionCount=${result.transactions.length} completed=${result.completed}`,
        (error, sync, externalAccountId) =>
            `throw syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId} error=${getErrorMessage(error)}`
    )
    private async fetchTransactionBatch(sync: BankSyncEntityInterface, externalAccountId: string): Promise<BankSyncBatchResultInterface> {
        const service = new MonobankSyncService(sync.token);
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;

        return isForward
            ? await service.syncTransactionsForward(externalAccountId, sync.forwardSyncFromAt ?? new Date())
            : await service.syncTransactionsBackward(externalAccountId, sync.backwardSyncFromAt ?? new Date(), sync.backwardSyncedAt);
    }

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

    private async shouldYieldAfterRateLimit(): Promise<boolean> {
        if (!(await syncWorkloadService.waitForQueuedUserWork(MONOBANK_RATE_LIMIT_MS))) {
            return false;
        }

        return true;
    }

    private shouldYieldToQueuedWork(): boolean {
        return syncWorkloadService.hasQueuedWork();
    }

    private enqueueConsolidationForChangedTransactions(
        changedTransactions: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>>
    ): void {
        if (!isNotEmptyArray(changedTransactions)) {
            return;
        }

        const scope = consolidationScopeService.buildFromTransactions(changedTransactions);
        if (isDefined(scope)) {
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, scope);
        }
    }

    private async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const result = await this.executeSyncBatch(pendingSync);
        await this.updateSyncProgress(pendingSync, result);
        this.recordProcessedSyncBatch(pendingSync, result);
        const shouldYield = this.shouldYieldToQueuedWork() || (await this.shouldYieldAfterRateLimit());
        if (shouldYield) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        return await this.executeSyncLoop();
    }

    private recordProcessedSyncBatch(pendingSync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): void {
        if (pendingSync.mode === BankSyncModeEnum.FORWARD && result.completed) {
            this.processedForwardSyncIds.add(pendingSync.id);
        }
    }

    private async fetchBankAccountsAndJars(token: string): Promise<BankAccountInterface[]> {
        const service = new MonobankSyncService(token);
        const accounts = await service.syncAccounts();
        const jars = await service.syncJars();

        return [...accounts, ...jars];
    }

    private async getOrCreateAccount(bankAccount: BankAccountInterface): Promise<AccountEntityInterface> {
        return getOrCreateBankAccount(bankAccount);
    }

    private async createOrUpdateBankSync(accountId: number, token: string): Promise<void> {
        const existingSync = await bankSyncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            await bankSyncRepository.update(existingSync.id, { token, enabled: true, errorCount: 0, lastError: null });

            return;
        }

        const now = new Date();
        const earliestTxTime = await transactionService.getEarliestTransactionTimeByAccountId(accountId);
        await bankSyncRepository.create({
            token,
            accountId,
            provider: this.provider,
            enabled: true,
            mode: BankSyncModeEnum.BACKWARD,
            status: BankSyncStatusEnum.SYNCING,
            backwardSyncFromAt: now,
            backwardSyncedAt: earliestTxTime ?? null,
            forwardSyncFromAt: now,
            forwardSyncedAt: null
        });
    }
}

export const monobankSyncService = new AppMonobankSyncService();
