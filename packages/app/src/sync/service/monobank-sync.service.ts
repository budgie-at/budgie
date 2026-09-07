/* eslint-disable no-await-in-loop -- Sync orchestration requires sequential awaits */
import { consolidationScopeService } from '@budgie/consolidation';
import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { getSyncModule, loadSyncModule } from '../util/load-sync-module.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';
import { transferConsolidationService } from './transfer-consolidation.service';

import type { MccCategoryLookupInterface, SyncEntityInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncBatchResultInterface } from '@budgie/sync';

class AppMonobankSyncService extends AbstractPollingSyncService {
    override readonly supportsAddAccounts: boolean = true;

    protected readonly provider = ExternalSourceEnum.MONOBANK;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Monobank';
    protected readonly accountType = AccountTypeEnum.BANK_SYNC;
    protected rateLimitMs = 0;
    protected readonly backgroundTaskName = MONOBANK_SYNC_TASK;

    private mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} externalIds=${result.map(account => account.externalId).join(',')}`,
        (error, token) => `throw tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async fetchAccountsPreview(token: string): Promise<SyncAccountPreviewInterface[]> {
        await loadSyncModule();
        const bankAccounts = await this.fetchBankAccountsAndJars(token);
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return this.mapAccountsToPreview(bankAccounts);
    }

    @InvalidateDatabaseLiveQuery()
    @Log(
        (token, externalIds) => `enter tokenLen=${token.length} externalIdCount=${externalIds.length}`,
        (result, token, externalIds) => `done tokenLen=${token.length} externalIdCount=${externalIds.length} result=${String(result)}`,
        (error, token, externalIds) =>
            `throw tokenLen=${token.length} externalIdCount=${externalIds.length} error=${getErrorMessage(error)}`
    )
    override async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<void> {
        await loadSyncModule();
        const bankAccounts = await this.fetchBankAccountsAndJars(token);

        for (const externalId of externalIds) {
            const bankAccount = bankAccounts.find(acc => acc.id === externalId);
            if (isDefined(bankAccount)) {
                const account = await this.getOrCreateSyncAccount(bankAccount);
                await this.createOrUpdateSync(account.id, token);
            }
        }

        void this.registerBackgroundTask();
        void this.sync();
    }

    @Log(
        (accountId, enabled) => `enter accountId=${accountId} enabled=${String(enabled)}`,
        (result, accountId, enabled) => `done accountId=${accountId} enabled=${String(enabled)} result=${String(result)}`,
        (error, accountId, enabled) => `throw accountId=${accountId} enabled=${String(enabled)} error=${getErrorMessage(error)}`
    )
    override async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await super.setAccountSyncEnabled(accountId, enabled);
        if (enabled) {
            void this.sync();
        }
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
    protected override async executeSyncBatch(sync: SyncEntityInterface): Promise<SyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const token = await this.resolveSyncToken(sync);
        const result = await this.fetchTransactionBatch(sync, account.externalId, token);
        await microPause();

        const changedTransactions = await this.processFetchedTransactions(result.transactions, account.id);
        await this.reconcileChangedTransactions(changedTransactions);

        await microPause();

        return result;
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    protected override async beforeSyncRun(): Promise<void> {
        this.rateLimitMs = (await loadSyncModule()).MONOBANK_RATE_LIMIT_MS;
        await this.loadMccCategories();
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

    @Log(
        changedTransactions => `enter changedTransactionCount=${changedTransactions.length}`,
        (result, changedTransactions) => `done changedTransactionCount=${changedTransactions.length} result=${String(result)}`,
        (error, changedTransactions) => `throw changedTransactionCount=${changedTransactions.length} error=${getErrorMessage(error)}`
    )
    private async reconcileChangedTransactions(
        changedTransactions: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>>
    ): Promise<void> {
        const consolidationScope = consolidationScopeService.buildFromTransactions(changedTransactions);
        if (!isDefined(consolidationScope)) {
            return;
        }

        try {
            await transferConsolidationService.consolidate(consolidationScope);
        } finally {
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, consolidationScope);
        }
    }

    @Log(
        (transactions, accountId) => `enter accountId=${accountId} transactionCount=${transactions.length}`,
        (result, transactions, accountId) =>
            `done accountId=${accountId} transactionCount=${transactions.length} changedTransactionCount=${result.length}`,
        (error, transactions, accountId) =>
            `throw accountId=${accountId} transactionCount=${transactions.length} error=${getErrorMessage(error)}`
    )
    private async processFetchedTransactions(
        transactions: SyncBatchResultInterface['transactions'],
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
            await transactionService.updateAllBalances();
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
        newTransactions: SyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(newTransactions)) {
            return [];
        }

        const inputs = await Promise.all(
            newTransactions.map(async bankTransaction => {
                const lookup = this.mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null;

                return mapBankTransactionToCreateInput(bankTransaction, accountId, lookup, this.provider);
            })
        );
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
        existingTransactions: SyncBatchResultInterface['transactions'],
        accountId: number
    ): Promise<number> {
        if (!isNotEmptyArray(existingTransactions)) {
            return 0;
        }

        for (const bankTransaction of existingTransactions) {
            await transactionService.update(await mapBankTransactionToCreateInput(bankTransaction, accountId, null, this.provider));
            await microPause();
        }

        return existingTransactions.length;
    }

    @Log(
        (sync, externalAccountId, token) =>
            `enter syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId} tokenLen=${token.length}`,
        (result, sync, externalAccountId, token) =>
            `done syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId} tokenLen=${token.length} transactionCount=${result.transactions.length} completed=${String(result.completed)}`,
        (error, sync, externalAccountId, token) =>
            `throw syncId=${sync.id} mode=${sync.mode} externalAccountId=${externalAccountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async fetchTransactionBatch(
        sync: SyncEntityInterface,
        externalAccountId: string,
        token: string
    ): Promise<SyncBatchResultInterface> {
        const { MonobankSyncService } = await loadSyncModule();
        const service = new MonobankSyncService(token);
        const isForward = sync.mode === SyncModeEnum.FORWARD;

        return isForward
            ? await service.syncTransactionsForward(externalAccountId, sync.forwardSyncFromAt ?? new Date())
            : await service.syncTransactionsBackward(externalAccountId, sync.backwardSyncFromAt ?? new Date(), sync.backwardSyncedAt);
    }

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} accountCount=${result.length}`,
        (error, token) => `throw tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async fetchBankAccountsAndJars(token: string): Promise<SyncAccountInterface[]> {
        const { MonobankSyncService } = await loadSyncModule();
        const service = new MonobankSyncService(token);
        const accounts = await service.syncAccounts();
        const jars = await service.syncJars();

        return [...accounts, ...jars];
    }

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        const { SyncAccountTypeEnum } = getSyncModule();

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
        const { SyncAccountTypeEnum } = getSyncModule();

        return account.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : super.accountIcon(account);
    }
}

export const monobankSyncService = new AppMonobankSyncService();
