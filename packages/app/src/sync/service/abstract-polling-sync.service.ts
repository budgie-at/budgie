import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { transactionService } from '../../transaction/service/transaction.service';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';

import { AbstractSyncService } from './abstract-sync.service';

import type { BankSyncBatchResultInterface } from '@budgie/bank-sync';
import type { SyncEntityInterface, SyncUpdateEntityInterface } from '@budgie/contracts';

export abstract class AbstractPollingSyncService extends AbstractSyncService {
    private static readonly FORWARD_SYNC_STALE_THRESHOLD_MS = TWO_MINUTES_IN_SECONDS * 1000;
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;

    override readonly supportsTokenAuth: boolean = true;

    private isRunning = false;

    protected abstract readonly rateLimitMs: number;
    protected abstract readonly backgroundTaskName: string;

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        try {
            await this.beforeSyncRun();

            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(this.backgroundTaskName)) {
            await BackgroundTask.unregisterTaskAsync(this.backgroundTaskName);
        }
        await BackgroundTask.registerTaskAsync(this.backgroundTaskName, {
            minimumInterval: AbstractPollingSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log(
        (accountId, token) => `enter accountId=${accountId} tokenLen=${token.length}`,
        (_result, accountId, token) => `done accountId=${accountId} tokenLen=${token.length}`,
        (error, accountId, token) => `throw accountId=${accountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    override async updateAccountToken(accountId: number, token: string): Promise<void> {
        this.validateToken(token);

        const bankSync = await syncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
            throw new Error('Bank sync not found');
        }
        await syncRepository.update(bankSync.id, { token, errorCount: 0, lastError: null });
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    protected async executeSyncLoop(): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            const enabledSyncs = await syncRepository.getEnabledByProvider(this.provider);
            if (!isNotEmptyArray(enabledSyncs)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            await this.beforeProcessRun(enabledSyncs[0].token);

            return await this.processPendingSyncs();
        } catch (error: unknown) {
            return this.handleError(error);
        }
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    protected async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const result = await this.executeSyncBatch(pendingSync);
        await this.applyProgressUpdate(pendingSync, result);
        await microPause(this.rateLimitMs);

        return await this.executeSyncLoop();
    }

    @Log('enter', result => `done found=${String(isDefined(result))}`, error => `throw error=${getErrorMessage(error)}`)
    protected async getNextPendingSync(): Promise<SyncEntityInterface | null> {
        const backwardSyncs = await syncRepository.getPendingBackwardSync(this.provider);
        if (isNotEmptyArray(backwardSyncs)) {
            await syncRepository.setStatus(backwardSyncs[0].id, SyncStatusEnum.SYNCING);

            return backwardSyncs[0];
        }

        const forwardSyncs = await syncRepository.getPendingForwardSync(
            this.provider,
            AbstractPollingSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        if (isNotEmptyArray(forwardSyncs)) {
            await syncRepository.setStatus(forwardSyncs[0].id, SyncStatusEnum.SYNCING);

            return forwardSyncs[0];
        }

        return null;
    }

    @Log(
        (sync, result) =>
            `enter syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${String(result.completed)}`,
        (_result, sync, result) =>
            `done syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${String(result.completed)}`,
        (error, sync, result) =>
            `throw syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} error=${getErrorMessage(error)}`
    )
    protected async applyProgressUpdate(sync: SyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        await syncRepository.update(sync.id, this.resolveProgressUpdate(sync, result));
    }

    @Log(
        error => `enter error=${getErrorMessage(error)}`,
        result => `done result=${String(result)}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async handleError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = await syncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        const syncToRetry = enabledSyncs.find(sync => sync.errorCount < SYNC_ERROR_THRESHOLD);
        if (isDefined(syncToRetry)) {
            await syncRepository.recordError(syncToRetry.id, errorMessage);
            await microPause(this.rateLimitMs);

            return this.executeSyncLoop();
        }

        await Promise.all(
            enabledSyncs.map(sync =>
                syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage, enabled: false })
            )
        );

        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    protected async createOrUpdateBankSync(accountId: number, token: string): Promise<void> {
        const existingSync = await syncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            await syncRepository.update(existingSync.id, { token, enabled: true, errorCount: 0, lastError: null });

            return;
        }

        const now = new Date();
        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(accountId);
        await syncRepository.create({
            token,
            accountId,
            provider: this.provider,
            enabled: true,
            mode: SyncModeEnum.BACKWARD,
            status: SyncStatusEnum.SYNCING,
            backwardSyncFromAt: now,
            backwardSyncedAt: earliestTransactionTime ?? null,
            forwardSyncFromAt: now,
            forwardSyncedAt: null
        });
    }

    protected async beforeProcessRun(_firstSyncToken: string): Promise<void> {
        return Promise.resolve();
    }

    protected validateToken(_token: string): void {
        // Providers without credential parsing accept any token; Binance overrides to validate.
    }

    private resolveProgressUpdate(sync: SyncEntityInterface, result: BankSyncBatchResultInterface): SyncUpdateEntityInterface {
        const now = new Date();
        const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };

        if (result.completed && sync.mode === SyncModeEnum.FORWARD) {
            return { ...baseUpdate, status: SyncStatusEnum.IDLE, forwardSyncedAt: now, forwardSyncFromAt: now };
        }

        if (result.completed) {
            return {
                ...baseUpdate,
                mode: SyncModeEnum.FORWARD,
                status: SyncStatusEnum.IDLE,
                backwardSyncedAt: result.nextTo,
                backwardSyncFromAt: result.nextFrom
            };
        }

        if (sync.mode === SyncModeEnum.BACKWARD) {
            const nextBackwardSyncedAt = isNotEmptyArray(result.transactions) ? null : (sync.backwardSyncedAt ?? result.nextTo);

            return { ...baseUpdate, backwardSyncedAt: nextBackwardSyncedAt, backwardSyncFromAt: result.nextTo };
        }

        return { ...baseUpdate, forwardSyncFromAt: result.nextFrom };
    }

    abstract fetchAccountsPreview(token: string): Promise<SyncAccountPreviewInterface[]>;

    abstract setupAccountSyncBatch(token: string, externalIds: string[]): Promise<unknown>;

    protected abstract executeSyncBatch(sync: SyncEntityInterface): Promise<BankSyncBatchResultInterface>;

    protected abstract beforeSyncRun(): Promise<void>;
}
