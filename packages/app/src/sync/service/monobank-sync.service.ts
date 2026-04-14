/* eslint-disable no-await-in-loop,lingui/no-unlocalized-strings */
import { BankAccountInterface, BankSyncBatchResultInterface, MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, mccCategoryRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS, TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { AccountEntityInterface } from '@budgie/contracts';

const FORWARD_SYNC_STALE_THRESHOLD_MS = TWO_MINUTES_IN_SECONDS * 1000;

class AppMonobankSyncService {
    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;
    private mccCategoryIdMap = new Map<string, number>();

    async fetchAccountsPreview(token: string): Promise<BankAccountPreviewInterface[]> {
        const bankAccounts = await new MonobankSyncService(token).syncAccounts();
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return mapBankAccountsToPreview(bankAccounts, this.provider);
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
            const mccCategories = await mccCategoryRepository.findAll();
            this.mccCategoryIdMap = new Map(mccCategories.map(mccCategory => [mccCategory.mcc, mccCategory.id]));

            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
        }
    }

    private async getOrCreateAccount(bankAccount: BankAccountInterface): Promise<AccountEntityInterface> {
        return getOrCreateBankAccount(bankAccount, this.provider);
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
        const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };

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
                backwardSyncFromAt: result.nextTo
            });
        } else {
            await bankSyncRepository.update(sync.id, {
                ...baseUpdate,
                forwardSyncFromAt: result.nextFrom
            });
        }
    }

    // eslint-disable-next-line max-statements -- Sync batch handles new + existing transactions with hold filtering
    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const result = await this.fetchTransactionBatch(sync, account.externalId);
        await microPause();

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const validTxs = result.transactions.filter(tx => !tx.hold);
        const newTxs = validTxs.filter(tx => !existingIds.has(tx.id));
        const existingTxs = validTxs.filter(tx => existingIds.has(tx.id));

        if (isNotEmptyArray(newTxs)) {
            await transactionService.bulkCreate(
                newTxs.map(tx =>
                    mapBankTransactionToCreateInput(tx, account.id, this.mccCategoryIdMap.get(String(tx.mcc)) ?? null, this.provider)
                )
            );
        }

        if (isNotEmptyArray(existingTxs)) {
            /* eslint-disable no-await-in-loop -- Sequential to preserve transaction order when updating existing bank transactions */
            for (const tx of existingTxs) {
                await transactionService.updateBankTransaction(
                    mapBankTransactionToCreateInput(tx, account.id, this.mccCategoryIdMap.get(String(tx.mcc)) ?? null, this.provider)
                );
            }
            /* eslint-enable no-await-in-loop */
        }
        await microPause();

        return result;
    }

    private async fetchTransactionBatch(sync: BankSyncEntityInterface, extAccId: string): Promise<BankSyncBatchResultInterface> {
        const svc = new MonobankSyncService(sync.token);
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;

        return isForward
            ? await svc.syncTransactionsForward(extAccId, sync.forwardSyncFromAt ?? new Date())
            : await svc.syncTransactionsBackward(extAccId, sync.backwardSyncFromAt ?? new Date());
    }
}

export const monobankSyncService = new AppMonobankSyncService();
