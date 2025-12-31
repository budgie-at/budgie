/* eslint-disable no-await-in-loop */
import { BankAccountInterface, BankSyncBatchResultInterface, MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
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
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { mapBankAccountToCreateInput } from '../util/map-bank-account-to-create-input.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { AccountEntityInterface } from '@budgie/contracts';

const MONOBANK_TOKEN_KEY = 'monobank-token';
const FORWARD_SYNC_STALE_THRESHOLD_MS = FIFTEEN_MINUTES_IN_SECONDS * 1000;

class AppMonobankSyncService {
    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;

    getToken(): string {
        return SecureStore.getItem(MONOBANK_TOKEN_KEY) ?? '';
    }

    async isEnabled(): Promise<boolean> {
        return isNotEmptyArray(await bankSyncRepository.getEnabledByProvider(this.provider));
    }

    async setEnabled(enabled: boolean, token: string): Promise<void> {
        SecureStore.setItem(MONOBANK_TOKEN_KEY, token);

        if (enabled) {
            void this.registerBackgroundTask();
            void this.sync();
        } else {
            await this.disableAllSyncs();
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
        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, { minimumInterval: FIFTEEN_MINUTES_IN_SECONDS });
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
        try {
            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
        }
    }

    private async disableAllSyncs(): Promise<void> {
        const syncs = await bankSyncRepository.getByProvider(this.provider);
        for (const sync of syncs) {
            await bankSyncRepository.setEnabled(sync.accountId, false);
        }
    }

    private async executeSyncLoop(): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            if (!isNotEmptyString(this.getToken())) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }
            await this.syncAndInitializeAccounts();
            if (!(await this.hasEnabledSyncs())) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            return await this.processPendingSyncs();
        } catch (error: unknown) {
            return await this.handleSyncError(error);
        }
    }

    private async syncAndInitializeAccounts(): Promise<void> {
        const bankAccounts = await new MonobankSyncService(this.getToken()).syncAccounts();

        const accounts = isNotEmptyArray(bankAccounts) ? await this.createMissingAccounts(bankAccounts) : [];

        await this.initializeBankSyncs(accounts);
        await microPause();
    }

    private async hasEnabledSyncs(): Promise<boolean> {
        return isNotEmptyArray(await bankSyncRepository.getEnabledByProvider(this.provider));
    }

    private async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }
        const result = await this.executeSyncBatch(pendingSync);
        await this.updateSyncProgress(pendingSync, result);
        await microPause(MONOBANK_RATE_LIMIT_MS);

        return await this.executeSyncLoop();
    }

    private async handleSyncError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }
        if (await this.attemptErrorRecovery(enabledSyncs, errorMessage)) {
            await microPause(MONOBANK_RATE_LIMIT_MS);

            return await this.executeSyncLoop();
        }
        await this.markAllSyncsAsFailed(enabledSyncs, errorMessage);

        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    private async attemptErrorRecovery(syncs: BankSyncEntityInterface[], errorMessage: string): Promise<boolean> {
        const syncWithRetries = syncs.find(sync => sync.errorCount > 0 && sync.errorCount < SYNC_ERROR_THRESHOLD);
        if (!isDefined(syncWithRetries)) {
            return false;
        }
        await bankSyncRepository.recordError(syncWithRetries.id, errorMessage);

        return true;
    }

    private async markAllSyncsAsFailed(syncs: BankSyncEntityInterface[], errorMessage: string): Promise<void> {
        for (const sync of syncs) {
            await bankSyncRepository.update(sync.id, { status: BankSyncStatusEnum.FAILED, lastError: errorMessage, enabled: false });
        }
    }

    private async initializeBankSyncs(accounts: AccountEntityInterface[]): Promise<void> {
        const now = new Date();
        for (const account of accounts.filter(acc => isNotEmptyString(acc.externalId))) {
            await this.createBankSyncIfNotExists(account, now);
        }
    }

    private async createBankSyncIfNotExists(account: AccountEntityInterface, now: Date): Promise<void> {
        if (isDefined(await bankSyncRepository.getByAccountId(account.id))) {
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
            backwardSyncedAt: earliestTxTime ?? null,
            forwardSyncFromAt: now,
            forwardSyncedAt: null
        });
    }

    private async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        return (await this.getNextBackwardSync()) ?? (await this.getNextForwardSync());
    }

    private async getNextBackwardSync(): Promise<BankSyncEntityInterface | null> {
        const syncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (!isNotEmptyArray(syncs)) {
            return null;
        }
        const [sync] = syncs;
        await bankSyncRepository.setStatus(sync.id, BankSyncStatusEnum.SYNCING);

        return sync;
    }

    private async getNextForwardSync(): Promise<BankSyncEntityInterface | null> {
        const syncs = await bankSyncRepository.getPendingForwardSync(this.provider, FORWARD_SYNC_STALE_THRESHOLD_MS);
        if (!isNotEmptyArray(syncs)) {
            return null;
        }
        const [sync] = syncs;
        await bankSyncRepository.setStatus(sync.id, BankSyncStatusEnum.SYNCING);

        return sync;
    }

    private async updateSyncProgress(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        const now = new Date();
        const isBackward = sync.mode === BankSyncModeEnum.BACKWARD;
        const txCount = sync.transactionCount + result.transactions.length;
        const baseUpdate = { transactionCount: txCount, errorCount: 0, lastError: null };

        if (result.completed) {
            await bankSyncRepository.update(sync.id, {
                ...baseUpdate,
                mode: BankSyncModeEnum.FORWARD,
                status: BankSyncStatusEnum.IDLE,
                ...(isBackward ? { backwardSyncedAt: now } : { forwardSyncedAt: now, forwardSyncFromAt: now })
            });
        } else {
            const cursor = isBackward ? { backwardSyncFromAt: result.nextTo } : { forwardSyncFromAt: result.nextFrom };
            await bankSyncRepository.update(sync.id, { ...baseUpdate, ...cursor });
        }
    }

    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }
        const result = await this.fetchTransactionBatch(sync, account.externalId);
        await microPause();

        const existing = await transactionService.findByExternalSource(this.provider);
        const existingIds = new Set(existing.map(tx => tx.externalId));

        const newTxs = result.transactions.filter(tx => !existingIds.has(tx.id));
        if (isNotEmptyArray(newTxs)) {
            await transactionService.bulkCreate(newTxs.map(tx => mapBankTransactionToCreateInput(tx, account.id, this.provider)));
        }
        await microPause();

        return result;
    }

    private async fetchTransactionBatch(sync: BankSyncEntityInterface, extAccId: string): Promise<BankSyncBatchResultInterface> {
        const svc = new MonobankSyncService(this.getToken());
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;

        return isForward
            ? await svc.syncTransactionsForward(extAccId, sync.forwardSyncFromAt ?? new Date())
            : await svc.syncTransactionsBackward(extAccId, sync.backwardSyncFromAt ?? new Date());
    }

    private async createMissingAccounts(bankAccounts: BankAccountInterface[]): Promise<AccountEntityInterface[]> {
        const [instruments, existingAccounts] = await Promise.all([
            instrumentRepository.getAll(),
            accountRepository.findByExternalIds(bankAccounts.map(acc => acc.id))
        ]);
        const existingIds = new Set(existingAccounts.map(acc => acc.externalId));
        const toCreate = bankAccounts
            .map(ba => {
                const inst = instruments.find(i => i.code === ba.currencyCode);

                return isDefined(inst) && !existingIds.has(ba.id) ? mapBankAccountToCreateInput(ba, inst.id, this.provider) : null;
            })
            .filter(isDefined);
        if (!isNotEmptyArray(toCreate)) {
            return existingAccounts;
        }

        return [...existingAccounts, ...Object.values(await accountService.bulkCreate(toCreate))];
    }
}

export const monobankSyncService = new AppMonobankSyncService();
