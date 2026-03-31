/* eslint-disable no-await-in-loop,no-console,lingui/no-unlocalized-strings */
import { BankAccountInterface, BankSyncBatchResultInterface, MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, mccCategoryRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS, TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { ruleEngineService } from '../../rule/service/rule-engine.service';
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
            console.log('[BankSync] Already running, skipping');

            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        console.log('[BankSync] Starting sync');
        try {
            const mccCategories = await mccCategoryRepository.findAll();
            this.mccCategoryIdMap = new Map(mccCategories.map(mccCategory => [mccCategory.mcc, mccCategory.id]));
            console.log(`[BankSync] Loaded ${mccCategories.length} MCC categories`);

            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
            console.log('[BankSync] Sync finished');
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
            console.log(`[BankSync] Enabled syncs: ${enabledSyncs.length}`);
            if (!isNotEmptyArray(enabledSyncs)) {
                console.log('[BankSync] No enabled syncs, exiting');

                return BackgroundTask.BackgroundTaskResult.Success;
            }

            return await this.processPendingSyncs();
        } catch (error: unknown) {
            console.error('[BankSync] Sync loop error:', getErrorMessage(error));

            return await this.handleSyncError(error);
        }
    }

    private async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            console.log('[BankSync] No pending syncs');

            return BackgroundTask.BackgroundTaskResult.Success;
        }

        console.log(
            `[BankSync] Processing sync id=${pendingSync.id} mode=${pendingSync.mode} status=${pendingSync.status} errors=${pendingSync.errorCount}`
        );
        const result = await this.executeSyncBatch(pendingSync);
        console.log(`[BankSync] Batch result: ${result.transactions.length} transactions, completed=${result.completed}`);
        await this.updateSyncProgress(pendingSync, result);
        await microPause(MONOBANK_RATE_LIMIT_MS);

        return await this.executeSyncLoop();
    }

    // eslint-disable-next-line max-statements -- Error recovery with retry logic and batch status updates
    private async handleSyncError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        console.error(`[BankSync] handleSyncError: ${errorMessage}`);
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

    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            console.warn(`[BankSync] Account not found or no externalId for sync accountId=${sync.accountId}`);

            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        console.log(`[BankSync] Fetching batch for account="${account.title}" externalId=${account.externalId} mode=${sync.mode}`);
        const result = await this.fetchTransactionBatch(sync, account.externalId);
        console.log(`[BankSync] Fetched ${result.transactions.length} transactions from API`);
        await microPause();

        await this.createTransactionsWithRules(result, account.id);
        await microPause();

        return result;
    }

    private async createTransactionsWithRules(result: BankSyncBatchResultInterface, accountId: number): Promise<void> {
        const existingIds = await transactionService.findByExternalSource(this.provider);
        const newTxs = result.transactions.filter(tx => !existingIds.has(tx.id));
        console.log(
            `[BankSync] Existing IDs: ${existingIds.size}, new transactions: ${newTxs.length} (filtered from ${result.transactions.length})`
        );

        if (isNotEmptyArray(newTxs)) {
            const inputs = newTxs.map(tx =>
                mapBankTransactionToCreateInput(tx, accountId, this.mccCategoryIdMap.get(String(tx.mcc)) ?? null, this.provider)
            );
            console.log(`[BankSync] Creating ${inputs.length} transactions for accountId=${accountId}`);
            const createdTransactions = await transactionService.bulkCreate(inputs);
            console.log(`[BankSync] Created ${createdTransactions.length} transactions`);

            try {
                await ruleEngineService.applyRulesToTransactions(
                    createdTransactions.map(({ id }) => id),
                    inputs
                );
            } catch (error) {
                 
                console.warn('[BankSync] Rule engine error:', getErrorMessage(error));
            }
        }
    }

    private async fetchTransactionBatch(sync: BankSyncEntityInterface, extAccId: string): Promise<BankSyncBatchResultInterface> {
        const svc = new MonobankSyncService(sync.token);
        const isForward = sync.mode === BankSyncModeEnum.FORWARD;
        const syncDate = isForward ? (sync.forwardSyncFromAt ?? new Date()) : (sync.backwardSyncFromAt ?? new Date());
        console.log(`[BankSync] Fetching ${isForward ? 'forward' : 'backward'} from=${syncDate.toISOString()} extAccId=${extAccId}`);

        return isForward ? await svc.syncTransactionsForward(extAccId, syncDate) : await svc.syncTransactionsBackward(extAccId, syncDate);
    }
}

export const monobankSyncService = new AppMonobankSyncService();
