/* eslint-disable no-await-in-loop, max-lines -- Sync orchestration requires sequential awaits and many log tags */
import { consolidationScopeService } from '@budgie/consolidation';
import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';
import { MONOBANK_RATE_LIMIT_MS, MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { MccCategoryLookupInterface, SyncEntityInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncBatchResultInterface } from '@budgie/sync';

const logger = getLogger('AppMonobankSyncService');

class AppMonobankSyncService extends AbstractPollingSyncService {
    protected readonly provider = ExternalSourceEnum.MONOBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Monobank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;
    protected readonly rateLimitMs = MONOBANK_RATE_LIMIT_MS;
    protected readonly backgroundTaskName = MONOBANK_SYNC_TASK;

    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} externalIds=${result.map(account => account.externalId).join(',')}`,
        (error, token) => `throw tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async fetchAccountsPreview(token: string): Promise<SyncAccountPreviewInterface[]> {
        const bankAccounts = await this.fetchBankAccountsAndJars(token);
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return this.mapAccountsToPreview(bankAccounts);
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
    protected async executeSyncBatch(sync: SyncEntityInterface): Promise<SyncBatchResultInterface> {
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
        'enter',
        result =>
            `done totalMccCount=${result.size} withDefaultCount=${[...result.values()].filter(value => isDefined(value.defaultCategoryId)).length}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async loadMccCategories(): Promise<Map<string, MccCategoryLookupInterface>> {
        this.mccCategoryLookupMap = await loadMccCategoryLookupMap();

        return this.mccCategoryLookupMap;
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
        transactions: SyncBatchResultInterface['transactions'],
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
                const account = await this.getOrCreateSyncAccount(bankAccount);
                await this.createOrUpdateBankSync(account.id, token);
            }
        }

        void this.registerBackgroundTask();
        void this.sync();
    }

    override async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await super.setAccountSyncEnabled(accountId, enabled);
        if (enabled) {
            void this.sync();
        }
    }

    protected override async beforeSyncRun(): Promise<void> {
        await this.loadMccCategories();
    }

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        if (account.type === SyncAccountTypeEnum.JAR && isNotEmptyString(account.title)) {
            return `${this.providerTitle} «${account.title}»`;
        }

        const cardType = account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase();

        if (isNotEmptyArray(account.maskedPan)) {
            const lastFourDigits = account.maskedPan[0].slice(-4);

            return `${this.providerTitle} ${cardType} •${lastFourDigits}`;
        }

        return `${this.providerTitle} ${cardType} ${account.currencyCode}`;
    }

    protected override accountIcon(account: SyncAccountInterface): UserIconNameEnum {
        return account.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : super.accountIcon(account);
    }

    // eslint-disable-next-line max-statements -- Sync import path keeps adjacent phase timing logs for live performance debugging
    private async processFetchedTransactions(
        transactions: SyncBatchResultInterface['transactions'],
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
        newTransactions: SyncBatchResultInterface['transactions'],
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
        existingTransactions: SyncBatchResultInterface['transactions'],
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

    private async fetchTransactionBatch(sync: SyncEntityInterface, extAccId: string): Promise<SyncBatchResultInterface> {
        const startedAt = Date.now();
        const svc = new MonobankSyncService(sync.token);
        const isForward = sync.mode === SyncModeEnum.FORWARD;

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

    private async fetchBankAccountsAndJars(token: string): Promise<SyncAccountInterface[]> {
        const service = new MonobankSyncService(token);
        const accounts = await service.syncAccounts();
        const jars = await service.syncJars();

        return [...accounts, ...jars];
    }
}

export const monobankSyncService = new AppMonobankSyncService();
