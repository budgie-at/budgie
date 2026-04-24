/* eslint-disable no-await-in-loop, lingui/no-unlocalized-strings, max-lines -- Sync orchestration requires sequential awaits and many log tags */
import { BankAccountInterface, BankSyncBatchResultInterface, MONOBANK_RATE_LIMIT_MS, MonobankSyncService } from '@budgie/bank-sync';
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum, ExternalSourceEnum, Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, mccCategoryRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS, TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { aiLog } from '../../ai/utils/ai-log.util';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { AccountEntityInterface } from '@budgie/contracts';

const logger = getLogger(LoggerNamespaceEnum.SYNC);
const FORWARD_SYNC_STALE_THRESHOLD_MS = TWO_MINUTES_IN_SECONDS * 1000;

class AppMonobankSyncService {
    private readonly provider = ExternalSourceEnum.MONOBANK;
    private isRunning = false;
    private mccCategoryIdMap = new Map<string, number>();

    @Log(LoggerNamespaceEnum.SYNC, 'sync:start', 'sync:end')
     
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            logger.log('sync:skip:already-running', {});

            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        try {
            const mccCategories = await mccCategoryRepository.findAll();
            this.mccCategoryIdMap = new Map(mccCategories.map(mccCategory => [mccCategory.mcc, mccCategory.id]));
            logger.log('sync:mccCategoriesLoaded', { count: this.mccCategoryIdMap.size });

            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
        }
    }

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
            logger.log('loop:enabledSyncs', {
                count: enabledSyncs.length,
                accountIds: enabledSyncs.map(entry => entry.accountId),
                tokens: enabledSyncs.map(entry => ({ accountId: entry.accountId, token: entry.token }))
            });
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

    // eslint-disable-next-line max-statements -- Error recovery with retry logic and bulk-disable path
    private async handleSyncError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        logger.error('error:caught', { message: errorMessage });
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
            logger.log('next:backward', {
                syncId: backwardSyncs[0].id,
                accountId: backwardSyncs[0].accountId,
                backwardSyncFromAt: backwardSyncs[0].backwardSyncFromAt,
                backwardSyncedAt: backwardSyncs[0].backwardSyncedAt
            });

            return backwardSyncs[0];
        }

        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(this.provider, FORWARD_SYNC_STALE_THRESHOLD_MS);
        if (isNotEmptyArray(forwardSyncs)) {
            await bankSyncRepository.setStatus(forwardSyncs[0].id, BankSyncStatusEnum.SYNCING);
            logger.log('next:forward', {
                syncId: forwardSyncs[0].id,
                accountId: forwardSyncs[0].accountId,
                forwardSyncFromAt: forwardSyncs[0].forwardSyncFromAt,
                forwardSyncedAt: forwardSyncs[0].forwardSyncedAt
            });

            return forwardSyncs[0];
        }

        logger.log('next:none', {});

        return null;
    }

    private async updateSyncProgress(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        const now = new Date();
        const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };
        logger.log('updateSyncProgress:enter', {
            syncId: sync.id,
            accountId: sync.accountId,
            currentMode: sync.mode,
            completed: result.completed,
            resultTransactionsLength: result.transactions.length,
            resultNextFrom: result.nextFrom,
            resultNextTo: result.nextTo,
            priorForwardSyncFromAt: sync.forwardSyncFromAt,
            priorBackwardSyncFromAt: sync.backwardSyncFromAt,
            priorBackwardSyncedAt: sync.backwardSyncedAt,
            priorTransactionCount: sync.transactionCount
        });

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

    // eslint-disable-next-line max-statements -- Batch orchestration with guard, fetch, dedup, and bulkCreate
    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            logger.log('batch:skip:no-account-or-externalId', {
                accountId: sync.accountId,
                found: isDefined(account),
                externalId: account?.externalId
            });

            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        logger.log('batch:start', {
            accountId: account.id,
            externalId: account.externalId,
            mode: sync.mode,
            forwardSyncFromAt: sync.forwardSyncFromAt,
            backwardSyncFromAt: sync.backwardSyncFromAt
        });

        const result = await this.fetchTransactionBatch(sync, account.externalId);
        await microPause();

        logger.log('batch:fetched', {
            rawCount: result.transactions.length,
            completed: result.completed,
            nextFrom: result.nextFrom,
            nextTo: result.nextTo
        });

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const heldCount = result.transactions.filter(transaction => transaction.hold).length;
        const duplicateCount = result.transactions.filter(transaction => existingIds.has(transaction.id)).length;
        const newTransactions = result.transactions.filter(bankTransaction => !existingIds.has(bankTransaction.id));
        logger.log('batch:filtered', {
            raw: result.transactions.length,
            held: heldCount,
            duplicates: duplicateCount,
            existingIdsTotal: existingIds.size,
            new: newTransactions.length
        });

        if (isNotEmptyArray(newTransactions)) {
            try {
                aiLog('embed:defer:bank-sync:batch:begin', {
                    provider: this.provider,
                    accountId: account.id,
                    count: newTransactions.length
                });
                const created = await transactionService.bulkCreate(
                    newTransactions.map(bankTransaction =>
                        mapBankTransactionToCreateInput(
                            bankTransaction,
                            account.id,
                            this.mccCategoryIdMap.get(String(bankTransaction.mcc)) ?? null,
                            this.provider
                        )
                    )
                );
                logger.log('batch:created', { attempted: newTransactions.length, inserted: created.length });
                aiLog('embed:defer:bank-sync:batch:complete', {
                    provider: this.provider,
                    accountId: account.id,
                    inserted: created.length
                });
            } catch (error: unknown) {
                logger.error('batch:bulkCreate:error', { message: getErrorMessage(error) });
                aiLog('embed:defer:bank-sync:batch:throw', { provider: this.provider, errorMessage: getErrorMessage(error) });
                throw error;
            }
        } else {
            logger.log('batch:no-new-transactions', {});
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
