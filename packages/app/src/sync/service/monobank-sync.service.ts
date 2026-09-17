/* eslint-disable no-await-in-loop -- Sync orchestration requires sequential awaits */
import { consolidationScopeService } from '@budgie/consolidation';
import {
    AccountTypeEnum,
    ExternalSourceEnum,
    SyncBalanceAuthorityEnum,
    SyncModeEnum,
    transactionAsync,
    UserIconNameEnum
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, db, syncRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { loadMccCategoryLookupMap } from '../util/load-mcc-category-lookup-map.util';
import { getSyncModule, loadSyncModule } from '../util/load-sync-module.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';
import { transferConsolidationService } from './transfer-consolidation.service';

import type {
    DB,
    MccCategoryLookupInterface,
    SyncEntityInterface,
    SyncUpdateEntityInterface,
    TransactionEntityInterface
} from '@budgie/contracts';
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

    @Log(
        accountId => `enter accountId=${accountId}`,
        (result, accountId) => `done accountId=${accountId} balance=${String(result)}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async fetchFreshProviderBalanceByAccountId(accountId: number): Promise<number | null> {
        const sync = await syncRepository.getByAccountId(accountId);
        const account = await accountRepository.findById(accountId);
        if (!isDefined(sync) || !isDefined(account) || !isNotEmptyString(account.externalId)) {
            return null;
        }

        return this.fetchProviderBalance(account.externalId, await this.resolveSyncToken(sync));
    }

    @InvalidateDatabaseLiveQuery()
    @Log(
        (token, externalIds, historyDepth) =>
            `enter tokenLen=${token.length} externalIdCount=${externalIds.length} historyDepth=${historyDepth}`,
        (result, token, externalIds, historyDepth) =>
            `done tokenLen=${token.length} externalIdCount=${externalIds.length} historyDepth=${historyDepth} result=${String(result)}`,
        (error, token, externalIds, historyDepth) =>
            `throw tokenLen=${token.length} externalIdCount=${externalIds.length} historyDepth=${historyDepth} error=${getErrorMessage(error)}`
    )
    override async setupAccountSyncBatch(
        token: string,
        externalIds: string[],
        historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL
    ): Promise<void> {
        await loadSyncModule();
        const bankAccounts = await this.fetchBankAccountsAndJars(token);

        const selectedAccounts = bankAccounts.filter(account => externalIds.includes(account.id));

        await transactionAsync(db, async tx => {
            for (const bankAccount of selectedAccounts) {
                const account = await this.getOrCreateSyncAccount(bankAccount, tx);
                const sync = await this.createOrUpdateSync(account.id, token, historyDepth, tx);
                await syncRepository.update(sync.id, { balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER }, tx);
                await accountBalanceRepository.upsert(
                    { accountId: account.id, amount: convertToMicroUnits(bankAccount.balance), updatedAt: new Date() },
                    tx
                );
            }
        });

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
        if (!enabled) {
            await this.releaseBalanceAuthority(accountId);

            return;
        }

        void this.sync();
    }

    @Log(
        (sync, runGeneration) => `enter syncId=${sync.id} mode=${sync.mode} runGeneration=${runGeneration}`,
        (result, sync, runGeneration) =>
            `done syncId=${sync.id} mode=${sync.mode} runGeneration=${runGeneration} transactionCount=${result.transactions.length} transactionIds=${result.transactions
                .slice(0, 5)
                .map(transaction => transaction.id)
                .join(',')} completed=${result.completed}`,
        (error, sync, runGeneration) =>
            `throw syncId=${sync.id} mode=${sync.mode} runGeneration=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected override async executeSyncBatch(sync: SyncEntityInterface, runGeneration: number): Promise<SyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!this.isRunCurrent(runGeneration)) {
            return this.buildInterruptedBatchResult();
        }

        return this.executeAccountSyncBatch(sync, account, runGeneration);
    }

    @Log(
        (sync, { transactions, completed }, runGeneration) =>
            `enter monobankSyncId=${sync.id} authority=${sync.balanceAuthority} mode=${sync.mode} importedIds=${transactions.map(transaction => transaction.id).join(',')} batchComplete=${String(completed)} generation=${runGeneration}`,
        (_result, sync, { transactions, completed }, runGeneration) =>
            `done monobankSyncId=${sync.id} authority=${sync.balanceAuthority} mode=${sync.mode} importedIds=${transactions.map(transaction => transaction.id).join(',')} batchComplete=${String(completed)} generation=${runGeneration}`,
        (error, sync, { transactions, completed }, runGeneration) =>
            `throw monobankSyncId=${sync.id} authority=${sync.balanceAuthority} mode=${sync.mode} importedIds=${transactions.map(transaction => transaction.id).join(',')} batchComplete=${String(completed)} generation=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected override async applyProgressUpdate(
        sync: SyncEntityInterface,
        result: SyncBatchResultInterface,
        runGeneration: number
    ): Promise<void> {
        const shouldReconcile =
            sync.mode === SyncModeEnum.FORWARD && result.completed && sync.balanceAuthority === SyncBalanceAuthorityEnum.PROVIDER;
        if (!shouldReconcile) {
            await super.applyProgressUpdate(sync, result, runGeneration);

            return;
        }

        const providerBalance = await this.fetchFreshProviderBalanceByAccountId(sync.accountId);
        if (!isDefined(providerBalance) || !this.isRunCurrent(runGeneration)) {
            await super.applyProgressUpdate(sync, result, runGeneration);

            return;
        }

        await this.finalizeProviderBalance(sync.id, sync.accountId, providerBalance, this.resolveProgressUpdate(sync, result));
    }

    @Log(
        accountId => `enter accountId=${accountId}`,
        (_result, accountId) => `done accountId=${accountId}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    protected override async releaseBalanceAuthority(accountId: number): Promise<void> {
        const sync = await syncRepository.getByAccountId(accountId);
        if (!isDefined(sync) || sync.balanceAuthority !== SyncBalanceAuthorityEnum.PROVIDER) {
            return;
        }

        const storedBalances = await accountBalanceRepository.getByAccountIds([accountId]);
        if (!isNotEmptyArray(storedBalances)) {
            return;
        }

        await this.finalizeProviderBalance(sync.id, accountId, storedBalances[0].amount, {});
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
        (changedTransactions, runGeneration) =>
            `enter runGeneration=${runGeneration} changedTransactionCount=${changedTransactions.length}`,
        (result, changedTransactions, runGeneration) =>
            `done runGeneration=${runGeneration} changedTransactionCount=${changedTransactions.length} result=${String(result)}`,
        (error, changedTransactions, runGeneration) =>
            `throw runGeneration=${runGeneration} changedTransactionCount=${changedTransactions.length} error=${getErrorMessage(error)}`
    )
    private async reconcileChangedTransactions(
        changedTransactions: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>>,
        runGeneration: number
    ): Promise<void> {
        const consolidationScope = consolidationScopeService.buildFromTransactions(changedTransactions);
        if (!this.isRunCurrent(runGeneration) || !isDefined(consolidationScope)) {
            return;
        }

        try {
            await transferConsolidationService.consolidate(consolidationScope);
        } finally {
            if (this.isRunCurrent(runGeneration)) {
                transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, consolidationScope);
            }
        }
    }

    @Log(
        (transactions, accountId, runGeneration) =>
            `enter accountId=${accountId} runGeneration=${runGeneration} transactionCount=${transactions.length}`,
        (result, transactions, accountId, runGeneration) =>
            `done accountId=${accountId} runGeneration=${runGeneration} transactionCount=${transactions.length} changedTransactionCount=${result.length}`,
        (error, transactions, accountId, runGeneration) =>
            `throw accountId=${accountId} runGeneration=${runGeneration} transactionCount=${transactions.length} error=${getErrorMessage(error)}`
    )
    private async processFetchedTransactions(
        transactions: SyncBatchResultInterface['transactions'],
        accountId: number,
        runGeneration: number
    ): Promise<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]> {
        if (!isNotEmptyArray(transactions)) {
            return [];
        }

        const existingTransactionIdMap = await transactionService.findIdMapByExternalSource(this.provider);
        if (!this.isRunCurrent(runGeneration)) {
            return [];
        }

        const newTransactions = transactions.filter(bankTransaction => !existingTransactionIdMap.has(bankTransaction.id));
        const existingTransactions = transactions.filter(bankTransaction => existingTransactionIdMap.has(bankTransaction.id));

        const createdTransactions = await this.createNewTransactions(newTransactions, accountId, runGeneration);
        const updatedTransactionCount = await this.updateExistingTransactions(existingTransactions, accountId, runGeneration);
        if (this.isRunCurrent(runGeneration) && isPositiveNumber(updatedTransactionCount)) {
            await transactionService.updateAllBalances();
        }

        return [...createdTransactions, ...this.buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap)];
    }

    @Log(
        (newTransactions, accountId, runGeneration) =>
            `enter accountId=${accountId} runGeneration=${runGeneration} transactionCount=${newTransactions.length}`,
        (result, newTransactions, accountId, runGeneration) =>
            `done accountId=${accountId} runGeneration=${runGeneration} transactionCount=${newTransactions.length} createdTransactionCount=${result.length}`,
        (error, newTransactions, accountId, runGeneration) =>
            `throw accountId=${accountId} runGeneration=${runGeneration} transactionCount=${newTransactions.length} error=${getErrorMessage(error)}`
    )
    private async createNewTransactions(
        newTransactions: SyncBatchResultInterface['transactions'],
        accountId: number,
        runGeneration: number
    ): Promise<TransactionEntityInterface[]> {
        if (!this.isRunCurrent(runGeneration) || !isNotEmptyArray(newTransactions)) {
            return [];
        }

        const inputs = await Promise.all(
            newTransactions.map(async bankTransaction => {
                const lookup = this.mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null;

                return mapBankTransactionToCreateInput(bankTransaction, accountId, lookup, this.provider);
            })
        );
        const prepared = await ruleEngineService.prepareCreateInputsForRules(inputs);
        if (!this.isRunCurrent(runGeneration)) {
            return [];
        }

        const createdTransactions = await transactionService.bulkCreate(prepared.transactionInputs);
        const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
        const postCreateTransactionInputs = prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined);

        if (this.isRunCurrent(runGeneration) && isNotEmptyArray(postCreateTransactionIds)) {
            ruleApplicationDrainerService.enqueueTransactions(postCreateTransactionIds, postCreateTransactionInputs);
        }

        return createdTransactions;
    }

    @Log(
        (existingTransactions, accountId, runGeneration) =>
            `enter accountId=${accountId} runGeneration=${runGeneration} transactionCount=${existingTransactions.length}`,
        (result, existingTransactions, accountId, runGeneration) =>
            `done accountId=${accountId} runGeneration=${runGeneration} transactionCount=${existingTransactions.length} updatedTransactionCount=${result}`,
        (error, existingTransactions, accountId, runGeneration) =>
            `throw accountId=${accountId} runGeneration=${runGeneration} transactionCount=${existingTransactions.length} error=${getErrorMessage(error)}`
    )
    private async updateExistingTransactions(
        existingTransactions: SyncBatchResultInterface['transactions'],
        accountId: number,
        runGeneration: number
    ): Promise<number> {
        if (!this.isRunCurrent(runGeneration) || !isNotEmptyArray(existingTransactions)) {
            return 0;
        }

        for (const bankTransaction of existingTransactions) {
            if (!this.isRunCurrent(runGeneration)) {
                return 0;
            }

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
            : await service.syncTransactionsBackward(
                  externalAccountId,
                  sync.backwardSyncFromAt ?? new Date(),
                  sync.backwardSyncedAt,
                  sync.backwardSyncLimitAt
              );
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

    @Log(
        (externalAccountId, token) => `enter externalAccountId=${externalAccountId} tokenLen=${token.length}`,
        (result, externalAccountId, token) => `done externalAccountId=${externalAccountId} tokenLen=${token.length} balance=${result}`,
        (error, externalAccountId, token) =>
            `throw externalAccountId=${externalAccountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async fetchProviderBalance(externalAccountId: string, token: string): Promise<number> {
        const bankAccounts = await this.fetchBankAccountsAndJars(token);
        const bankAccount = bankAccounts.find(account => account.id === externalAccountId);
        if (!isDefined(bankAccount)) {
            throw new Error(UNKNOWN_SYNC_ERROR);
        }

        return convertToMicroUnits(bankAccount.balance);
    }

    @InvalidateDatabaseLiveQuery()
    @Log(
        (syncId, accountId, providerBalance) => `enter syncId=${syncId} accountId=${accountId} providerBalance=${providerBalance}`,
        (_result, ...[syncId, accountId, providerBalance]) =>
            `done syncId=${syncId} accountId=${accountId} providerBalance=${providerBalance}`,
        (error, ...[syncId, accountId, providerBalance]) =>
            `throw syncId=${syncId} accountId=${accountId} providerBalance=${providerBalance} error=${getErrorMessage(error)}`
    )
    private async finalizeProviderBalance(
        syncId: number,
        accountId: number,
        providerBalance: number,
        progressUpdate: SyncUpdateEntityInterface
    ): Promise<void> {
        await transactionAsync(db, async tx => {
            const sync = await syncRepository.getById(syncId, tx);
            if (!isDefined(sync)) {
                return;
            }

            if (sync.accountId !== accountId || sync.balanceAuthority !== SyncBalanceAuthorityEnum.PROVIDER) {
                return;
            }

            await this.replaceBalanceAdjustment(sync, providerBalance, progressUpdate, tx);
        });
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

    private async executeAccountSyncBatch(
        sync: SyncEntityInterface,
        account: Awaited<ReturnType<typeof accountRepository.findById>>,
        runGeneration: number
    ): Promise<SyncBatchResultInterface> {
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            const now = new Date();

            return { transactions: [], nextTo: now, nextFrom: now, completed: true };
        }

        const result = await this.fetchCurrentTransactionBatch(sync, account.externalId, runGeneration);
        if (!isDefined(result)) {
            return this.buildInterruptedBatchResult();
        }

        await this.commitFetchedBatch(result, account.id, runGeneration);

        return result;
    }

    private async fetchCurrentTransactionBatch(
        sync: SyncEntityInterface,
        externalAccountId: string,
        runGeneration: number
    ): Promise<SyncBatchResultInterface | null> {
        const token = await this.resolveSyncToken(sync);
        if (!this.isRunCurrent(runGeneration)) {
            return null;
        }

        const result = await this.fetchTransactionBatch(sync, externalAccountId, token);

        return this.isRunCurrent(runGeneration) ? result : null;
    }

    private async commitFetchedBatch(result: SyncBatchResultInterface, accountId: number, runGeneration: number): Promise<void> {
        await microPause();
        if (!this.isRunCurrent(runGeneration)) {
            return;
        }

        const changedTransactions = await this.processFetchedTransactions(result.transactions, accountId, runGeneration);
        if (!this.isRunCurrent(runGeneration)) {
            return;
        }

        await this.reconcileChangedTransactions(changedTransactions, runGeneration);

        await microPause();
    }

    private async replaceBalanceAdjustment(
        sync: SyncEntityInterface,
        providerBalance: number,
        progressUpdate: SyncUpdateEntityInterface,
        tx: DB
    ): Promise<void> {
        const ledgerBalance = await accountBalanceRepository.getLedgerBalanceExcludingTransaction(
            sync.accountId,
            sync.balanceAdjustmentTransactionId,
            tx
        );
        const delta = providerBalance - ledgerBalance;

        if (isDefined(sync.balanceAdjustmentTransactionId)) {
            await transactionRepository.deleteById(sync.balanceAdjustmentTransactionId, tx);
        }

        const adjustmentTransactionId =
            delta === 0 ? null : await transactionService.createBalanceAdjustment(sync.accountId, delta, new Date(), tx);

        await accountBalanceRepository.upsert({ accountId: sync.accountId, amount: providerBalance, updatedAt: new Date() }, tx);
        await syncRepository.update(
            sync.id,
            {
                ...progressUpdate,
                balanceAuthority: SyncBalanceAuthorityEnum.LEDGER,
                balanceAdjustmentTransactionId: adjustmentTransactionId
            },
            tx
        );
    }

    private buildInterruptedBatchResult(): SyncBatchResultInterface {
        const now = new Date();

        return { transactions: [], nextTo: now, nextFrom: now, completed: false };
    }
}

export const monobankSyncService = new AppMonobankSyncService();
