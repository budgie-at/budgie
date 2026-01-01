/* eslint-disable no-await-in-loop,lingui/no-unlocalized-strings */
import { BankAccountInterface, BankSyncBatchResultInterface, MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
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
import { generateBankAccountTitle, mapBankAccountToCreateInput } from '../util/map-bank-account-to-create-input.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { AccountEntityInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';

const FORWARD_SYNC_STALE_THRESHOLD_MS = FIFTEEN_MINUTES_IN_SECONDS * 1000;

export interface BankAccountPreviewInterface {
    readonly externalId: string;
    readonly title: string;
    readonly currencyCode: string;
    readonly iban: string | null;
    readonly existingAccountId: number | null;
    readonly hasBankSync: boolean;
}

class AppMonobankSyncService {
    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;

    async fetchAccountsPreview(token: string): Promise<BankAccountPreviewInterface[]> {
        const bankAccounts = await new MonobankSyncService(token).syncAccounts();
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        const existingAccounts = await accountRepository.findByExternalIds(bankAccounts.map(acc => acc.id));
        const existingMap = new Map(existingAccounts.map(acc => [acc.externalId, acc]));
        const existingSyncs = await bankSyncRepository.getByProvider(this.provider);
        const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

        return bankAccounts.map(ba => {
            const existingAccount = existingMap.get(ba.id);

            return {
                externalId: ba.id,
                title: generateBankAccountTitle(ba),
                currencyCode: ba.currencyCode,
                iban: ba.iban ?? null,
                existingAccountId: existingAccount?.id ?? null,
                hasBankSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id)
            };
        });
    }

    async setupAccountSync(token: string, externalId: string): Promise<void> {
        const bankAccounts = await new MonobankSyncService(token).syncAccounts();
        const bankAccount = bankAccounts.find(acc => acc.id === externalId);
        if (!isDefined(bankAccount)) {
            throw new Error('Bank account not found');
        }

        const account = await this.getOrCreateAccount(bankAccount);
        await this.createOrUpdateBankSync(account.id, token);
        void this.registerBackgroundTask();
        void this.sync();
    }

    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<void> {
        const bankAccounts = await new MonobankSyncService(token).syncAccounts();

        for (const externalId of externalIds) {
            const bankAccount = bankAccounts.find(acc => acc.id === externalId);
            if (isDefined(bankAccount)) {
                const account = await this.getOrCreateAccount(bankAccount);
                await this.createOrUpdateBankSync(account.id, token);
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

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK)) {
            return;
        }
        TaskManager.defineTask(MONOBANK_SYNC_TASK, () => this.sync());
        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, { minimumInterval: FIFTEEN_MINUTES_IN_SECONDS });
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

    private async getOrCreateAccount(bankAccount: BankAccountInterface): Promise<AccountEntityInterface> {
        const existing = await accountRepository.findByExternalIds([bankAccount.id]);
        if (isNotEmptyArray(existing)) {
            return existing[0];
        }

        const instruments = await instrumentRepository.getAll();
        const instrument = instruments.find(inst => inst.code === bankAccount.currencyCode);
        if (!isDefined(instrument)) {
            throw new Error(`Instrument not found for currency: ${bankAccount.currencyCode}`);
        }

        const input: LiabilityAccountCreateInputInterface = mapBankAccountToCreateInput(bankAccount, instrument.id, this.provider);

        return Object.values(await accountService.bulkCreate([input]))[0];
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
            accountId,
            provider: this.provider,
            token,
            enabled: true,
            mode: BankSyncModeEnum.BACKWARD,
            status: BankSyncStatusEnum.SYNCING,
            backwardSyncFromAt: now,
            backwardSyncedAt: earliestTxTime ?? null,
            forwardSyncFromAt: now,
            forwardSyncedAt: null
        });
    }

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

    private async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSyncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (isNotEmptyArray(backwardSyncs)) {
            await bankSyncRepository.setStatus(backwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

            return backwardSyncs[0];
        }

        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(this.provider, FORWARD_SYNC_STALE_THRESHOLD_MS);
        if (isNotEmptyArray(forwardSyncs)) {
            await bankSyncRepository.setStatus(forwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

            return forwardSyncs[0];
        }

        return null;
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
                ...(isBackward ? { backwardSyncedAt: result.nextTo } : { forwardSyncedAt: now, forwardSyncFromAt: now })
            });
        } else {
            const cursor = isBackward ? { backwardSyncedAt: result.nextTo } : { forwardSyncFromAt: result.nextFrom };
            await bankSyncRepository.update(sync.id, { ...baseUpdate, ...cursor });
        }
    }

    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const result = await this.fetchTransactionBatch(sync, account.externalId);
        await this.processNewTransactions(result, sync.accountId);

        return result;
    }

    private async fetchTransactionBatch(sync: BankSyncEntityInterface, extAccId: string): Promise<BankSyncBatchResultInterface> {
        const svc = new MonobankSyncService(sync.token);
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;

        return isForward
            ? await svc.syncTransactionsForward(extAccId, sync.forwardSyncFromAt ?? new Date())
            : await svc.syncTransactionsBackward(extAccId, sync.backwardSyncFromAt ?? new Date());
    }

    private async processNewTransactions(result: BankSyncBatchResultInterface, accountId: number): Promise<void> {
        await microPause();
        const existing = await transactionService.findByExternalSource(this.provider);
        const existingIds = new Set(existing.map(tx => tx.externalId));
        const newTxs = result.transactions.filter(tx => !existingIds.has(tx.id));

        if (isNotEmptyArray(newTxs)) {
            await transactionService.bulkCreate(newTxs.map(tx => mapBankTransactionToCreateInput(tx, accountId, this.provider)));
        }
        await microPause();
    }
}

export const monobankSyncService = new AppMonobankSyncService();
