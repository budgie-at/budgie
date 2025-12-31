/* eslint-disable lingui/no-unlocalized-strings,no-await-in-loop,max-statements,max-lines */
import {
    BankAccountInterface,
    BankSyncBatchResultInterface,
    BankTransactionInterface,
    BankTransactionTypeEnum,
    MONOBANK_RATE_LIMIT_MS,
    MonobankSyncService
} from '@budgie/bank-sync';
import {
    AccountTypeEnum,
    BankSyncEntityInterface,
    BankSyncModeEnum,
    BankSyncStatusEnum,
    ExternalSourceEnum,
    LiabilityAccountCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS } from '../../account/constant/fifteen-minutes-in-seconds.constant';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const MONOBANK_TOKEN_KEY = 'monobank-token';

class AppMonobankSyncService {
    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;

    getToken(): string {
        return SecureStore.getItem(MONOBANK_TOKEN_KEY) ?? '';
    }

    setToken(token: string): void {
        SecureStore.setItem(MONOBANK_TOKEN_KEY, token);
    }

    async isEnabled(): Promise<boolean> {
        const syncs = await bankSyncRepository.getEnabledByProvider(this.provider);

        return isNotEmptyArray(syncs);
    }

    async setEnabled(enabled: boolean, token: string): Promise<void> {
        this.setToken(token);

        if (!enabled) {
            const syncs = await bankSyncRepository.getByProvider(this.provider);
            for (const sync of syncs) {
                await bankSyncRepository.setEnabled(sync.accountId, false);
            }
        }

        this.isRunning = false;
        if (enabled) {
            void this.registerBackgroundTask();
        } else {
            void this.unregisterBackgroundTask();
        }
    }

    async setAccountEnabled(accountId: number, enabled: boolean): Promise<void> {
        await bankSyncRepository.setEnabled(accountId, enabled);

        if (enabled) {
            void this.sync();
        }
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK)) {
            return;
        }

        TaskManager.defineTask(MONOBANK_SYNC_TASK, () => this.sync());

        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, {
            minimumInterval: FIFTEEN_MINUTES_IN_SECONDS
        });
    }

    async unregisterBackgroundTask(): Promise<void> {
        if (!(await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK))) {
            return;
        }

        await BackgroundTask.unregisterTaskAsync(MONOBANK_SYNC_TASK);
    }

    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        this.isRunning = true;

        return await this.syncInternal();
    }

    async getStats(): Promise<{ totalAccounts: number; totalTransactions: number; syncs: BankSyncEntityInterface[] }> {
        const syncs = await bankSyncRepository.getByProvider(this.provider);
        const totalTransactions = syncs.reduce((sum, sync) => sum + sync.transactionCount, 0);

        return {
            totalAccounts: syncs.length,
            totalTransactions,
            syncs
        };
    }

    private async syncInternal(): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
            if (!isNotEmptyArray(enabledSyncs)) {
                this.isRunning = false;

                return BackgroundTask.BackgroundTaskResult.Success;
            }

            const syncedAccounts = await this.syncAccounts();
            await this.initializeBankSyncs(syncedAccounts);
            await microPause();

            const pendingSync = await this.getNextPendingSync();
            if (isDefined(pendingSync)) {
                const result = await this.syncBatch(pendingSync);
                await this.updateSyncAfterBatch(pendingSync, result);
                await microPause(MONOBANK_RATE_LIMIT_MS);

                return await this.syncInternal();
            }

            this.isRunning = false;

            return BackgroundTask.BackgroundTaskResult.Success;
        } catch (error: unknown) {
            return await this.handleSyncError(error);
        }
    }

    private async handleSyncError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        const syncWithErrors = enabledSyncs.find(bankSync => bankSync.errorCount > 0);

        if (isDefined(syncWithErrors) && syncWithErrors.errorCount < SYNC_ERROR_THRESHOLD) {
            await bankSyncRepository.recordError(syncWithErrors.id, getErrorMessage(error, 'Unknown error'));
            await microPause(MONOBANK_RATE_LIMIT_MS);

            return await this.syncInternal();
        }

        for (const sync of enabledSyncs) {
            await bankSyncRepository.update(sync.id, {
                status: BankSyncStatusEnum.FAILED,
                lastError: getErrorMessage(error),
                enabled: false
            });
        }

        this.isRunning = false;

        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    private async initializeBankSyncs(accounts: AccountEntityInterface[]): Promise<void> {
        const now = new Date();

        for (const account of accounts) {
            if (isNotEmptyString(account.externalId)) {
                await this.initializeBankSyncForAccount(account, now);
            }
        }
    }

    private async initializeBankSyncForAccount(account: AccountEntityInterface, now: Date): Promise<void> {
        const existingSync = await bankSyncRepository.getByAccountId(account.id);
        if (isDefined(existingSync)) {
            return;
        }

        const earliestTxTime = await transactionService.getEarliestTransactionTimeByAccountId(account.id);

        await bankSyncRepository.create({
            accountId: account.id,
            provider: this.provider,
            enabled: true,
            mode: BankSyncModeEnum.BACKWARD,
            status: BankSyncStatusEnum.SYNCING,
            backwardSyncFromAt: now,
            backwardSyncedAt: isDefined(earliestTxTime) ? earliestTxTime : null,
            forwardSyncFromAt: now,
            forwardSyncedAt: null
        });
    }

    private async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSyncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (isNotEmptyArray(backwardSyncs)) {
            const [sync] = backwardSyncs;
            await bankSyncRepository.setStatus(sync.id, BankSyncStatusEnum.SYNCING);

            return sync;
        }

        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(this.provider, FIFTEEN_MINUTES_IN_SECONDS * 1000);
        if (isNotEmptyArray(forwardSyncs)) {
            const [sync] = forwardSyncs;
            await bankSyncRepository.setStatus(sync.id, BankSyncStatusEnum.SYNCING);

            return sync;
        }

        return null;
    }

    private async updateSyncAfterBatch(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        const now = new Date();
        const isBackwardSync = sync.mode === BankSyncModeEnum.BACKWARD;
        const newTransactionCount = sync.transactionCount + result.transactions.length;

        if (result.completed) {
            await this.completeSyncBatch(sync.id, isBackwardSync, now, newTransactionCount);
        } else {
            await this.continueSyncBatch(sync.id, isBackwardSync, result, newTransactionCount);
        }
    }

    private async completeSyncBatch(syncId: number, isBackwardSync: boolean, now: Date, transactionCount: number): Promise<void> {
        if (isBackwardSync) {
            await bankSyncRepository.update(syncId, {
                mode: BankSyncModeEnum.FORWARD,
                status: BankSyncStatusEnum.IDLE,
                backwardSyncedAt: now,
                forwardSyncFromAt: now,
                transactionCount,
                errorCount: 0,
                lastError: null
            });
        } else {
            await bankSyncRepository.update(syncId, {
                status: BankSyncStatusEnum.IDLE,
                forwardSyncedAt: now,
                forwardSyncFromAt: now,
                transactionCount,
                errorCount: 0,
                lastError: null
            });
        }
    }

    private async continueSyncBatch(
        syncId: number,
        isBackwardSync: boolean,
        result: BankSyncBatchResultInterface,
        transactionCount: number
    ): Promise<void> {
        if (isBackwardSync) {
            await bankSyncRepository.update(syncId, {
                backwardSyncFromAt: result.nextTo,
                transactionCount,
                errorCount: 0,
                lastError: null
            });
        } else {
            await bankSyncRepository.update(syncId, {
                forwardSyncFromAt: result.nextFrom,
                transactionCount,
                errorCount: 0,
                lastError: null
            });
        }
    }

    private async syncAccounts(): Promise<AccountEntityInterface[]> {
        const syncService = new MonobankSyncService(this.getToken());

        const bankAccounts = await syncService.syncAccounts();
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return await this.createAccounts(bankAccounts);
    }

    private async syncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const syncService = new MonobankSyncService(this.getToken());
        const account = await accountRepository.findById(sync.accountId);

        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const isForwardSync = sync.mode === BankSyncModeEnum.FORWARD;
        const fromTime = sync.forwardSyncFromAt ?? new Date();
        const toTime = sync.backwardSyncFromAt ?? new Date();

        const result = isForwardSync
            ? await syncService.syncTransactionsForward(account.externalId, fromTime)
            : await syncService.syncTransactionsBackward(account.externalId, toTime);

        await microPause();

        const existingTransactions = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingTxIds = new Set(existingTransactions.map(tx => tx.externalId));

        const newTransactions = result.transactions.filter(tx => !existingTxIds.has(tx.id));
        if (isNotEmptyArray(newTransactions)) {
            await this.createTransactions(newTransactions, sync.accountId);
        }

        await microPause();

        return result;
    }

    private async createAccounts(bankAccounts: BankAccountInterface[]): Promise<AccountEntityInterface[]> {
        const [instruments, existingAccounts] = await Promise.all([
            instrumentRepository.getAll(),
            accountRepository.findByExternalIds(bankAccounts.map(account => account.id))
        ]);

        const existingIds = new Set(existingAccounts.map(acc => acc.externalId));

        const toCreate: LiabilityAccountCreateInputInterface[] = [];
        for (const bankAccount of bankAccounts) {
            const instrument = instruments.find(i => i.code === bankAccount.currencyCode);

            if (isDefined(instrument) && !existingIds.has(bankAccount.id)) {
                toCreate.push({
                    title: this.generateAccountTitle(bankAccount),
                    type: AccountTypeEnum.BANK_SYNC,
                    icon: UserIconNameEnum.Landmark,
                    instrumentId: instrument.id,
                    currentBalance: 0,
                    externalId: bankAccount.id,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    iban: bankAccount.iban
                });
            }
        }

        if (!isNotEmptyArray(toCreate)) {
            return existingAccounts;
        }

        return [...existingAccounts, ...Object.values(await accountService.bulkCreate(toCreate))];
    }

    private async createTransactions(
        bankTransactions: BankTransactionInterface[],
        accountId: number
    ): Promise<TransactionEntityInterface[]> {
        const transactionsToCreate = [];
        for (const bankTx of bankTransactions) {
            const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
            const amount = Math.abs(bankTx.amount);
            const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

            transactionsToCreate.push({
                amount,
                title: bankTx.description,
                comment: bankTx.comment ?? '',
                type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
                exchangeRate: 1,
                operatedAt: new Date(bankTx.time * 1000),
                externalId: bankTx.id,
                externalSource: ExternalSourceEnum.MONOBANK,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null,
                tagIds: [],
                entries: [{ accountId, type: entryType, amount, categoryId: null, externalId: bankTx.id }]
            });
        }

        return await transactionService.bulkCreate(transactionsToCreate);
    }

    private generateAccountTitle(bankAccount: BankAccountInterface): string {
        const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();
        if (isNotEmptyArray(bankAccount.maskedPan)) {
            return `Monobank ${cardType} •${bankAccount.maskedPan[0].slice(-4)}`;
        }

        return `Monobank ${cardType} ${bankAccount.currencyCode}`;
    }
}

export const monobankSyncService = new AppMonobankSyncService();
