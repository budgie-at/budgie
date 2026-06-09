import { BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { transactionService } from '../../transaction/service/transaction.service';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';

import { AbstractSyncService } from './abstract-sync.service';

import type { BankSyncBatchResultInterface } from '@budgie/bank-sync';
import type { BankSyncEntityInterface, BankSyncUpdateEntityInterface } from '@budgie/contracts';

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

        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
            throw new Error('Bank sync not found');
        }
        await bankSyncRepository.update(bankSync.id, { token, errorCount: 0, lastError: null });
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    protected async executeSyncLoop(): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
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
    protected async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSyncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (isNotEmptyArray(backwardSyncs)) {
            await bankSyncRepository.setStatus(backwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

            return backwardSyncs[0];
        }

        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(
            this.provider,
            AbstractPollingSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        if (isNotEmptyArray(forwardSyncs)) {
            await bankSyncRepository.setStatus(forwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

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
    protected async applyProgressUpdate(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        await bankSyncRepository.update(sync.id, this.resolveProgressUpdate(sync, result));
    }

    @Log(
        error => `enter error=${getErrorMessage(error)}`,
        result => `done result=${String(result)}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async handleError(error: unknown): Promise<BackgroundTask.BackgroundTaskResult> {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        const syncToRetry = enabledSyncs.find(sync => sync.errorCount < SYNC_ERROR_THRESHOLD);
        if (isDefined(syncToRetry)) {
            await bankSyncRepository.recordError(syncToRetry.id, errorMessage);
            await microPause(this.rateLimitMs);

            return this.executeSyncLoop();
        }

        await Promise.all(
            enabledSyncs.map(sync =>
                bankSyncRepository.update(sync.id, { status: BankSyncStatusEnum.FAILED, lastError: errorMessage, enabled: false })
            )
        );

        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    protected async createOrUpdateBankSync(accountId: number, token: string): Promise<void> {
        const existingSync = await bankSyncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            await bankSyncRepository.update(existingSync.id, { token, enabled: true, errorCount: 0, lastError: null });

            return;
        }

        const now = new Date();
        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(accountId);
        await bankSyncRepository.create({
            token,
            accountId,
            provider: this.provider,
            enabled: true,
            mode: BankSyncModeEnum.BACKWARD,
            status: BankSyncStatusEnum.SYNCING,
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

    private resolveProgressUpdate(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): BankSyncUpdateEntityInterface {
        const now = new Date();
        const baseUpdate = { transactionCount: sync.transactionCount + result.transactions.length, errorCount: 0, lastError: null };

        if (result.completed && sync.mode === BankSyncModeEnum.FORWARD) {
            return { ...baseUpdate, status: BankSyncStatusEnum.IDLE, forwardSyncedAt: now, forwardSyncFromAt: now };
        }

        if (result.completed) {
            return {
                ...baseUpdate,
                mode: BankSyncModeEnum.FORWARD,
                status: BankSyncStatusEnum.IDLE,
                backwardSyncedAt: result.nextTo,
                backwardSyncFromAt: result.nextFrom
            };
        }

        if (sync.mode === BankSyncModeEnum.BACKWARD) {
            const nextBackwardSyncedAt = isNotEmptyArray(result.transactions) ? null : (sync.backwardSyncedAt ?? result.nextTo);

            return { ...baseUpdate, backwardSyncedAt: nextBackwardSyncedAt, backwardSyncFromAt: result.nextTo };
        }

        return { ...baseUpdate, forwardSyncFromAt: result.nextFrom };
    }

    abstract fetchAccountsPreview(token: string): Promise<BankAccountPreviewInterface[]>;

    abstract setupAccountSyncBatch(token: string, externalIds: string[]): Promise<unknown>;

    protected abstract executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface>;

    protected abstract beforeSyncRun(): Promise<void>;
}
