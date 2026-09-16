import { SyncBalanceAuthorityEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { subMonths } from 'date-fns/subMonths';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, syncRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { transactionService } from '../../transaction/service/transaction.service';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';

import { AbstractSyncService } from './abstract-sync.service';
import { syncIntegrationTokenService } from './sync-integration-token.service';
import { syncWorkloadService } from './sync-workload.service';

import type { DB, SyncEntityInterface, SyncUpdateEntityInterface } from '@budgie/contracts';
import type { SyncBatchResultInterface } from '@budgie/sync';

export abstract class AbstractPollingSyncService extends AbstractSyncService {
    private static readonly FORWARD_SYNC_STALE_THRESHOLD_MS = 2 * 60 * 1000;
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;
    private static readonly BACKWARD_SYNC_LIMIT_MONTHS: Record<SyncHistoryDepthEnum, number | null> = {
        [SyncHistoryDepthEnum.MONTH_1]: 1,
        [SyncHistoryDepthEnum.MONTHS_3]: 3,
        [SyncHistoryDepthEnum.MONTHS_6]: 6,
        [SyncHistoryDepthEnum.YEAR_1]: 12,
        [SyncHistoryDepthEnum.FULL]: null,
        [SyncHistoryDepthEnum.NEW_ONLY]: 0
    };

    override readonly supportsTokenAuth: boolean = true;

    protected runDeadlineAtMs = Number.POSITIVE_INFINITY;
    protected runDeferred = false;

    private isRunning = false;
    private failedSyncId: number | null = null;
    private readonly processedForwardSyncIds = new Set<number>();
    private runGeneration = 0;
    private runRequested = false;

    protected abstract readonly rateLimitMs: number;
    protected abstract readonly backgroundTaskName: string;

    @Log(
        deadlineAtMs => `enter deadlineAtMs=${deadlineAtMs}`,
        (result, deadlineAtMs) => `done deadlineAtMs=${deadlineAtMs} result=${String(result)}`,
        (error, deadlineAtMs) => `throw deadlineAtMs=${deadlineAtMs} error=${getErrorMessage(error)}`
    )
    async sync(deadlineAtMs = Number.POSITIVE_INFINITY): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            this.runRequested = true;

            return BackgroundTask.BackgroundTaskResult.Success;
        }
        const runGeneration = this.startSyncRun(deadlineAtMs);
        try {
            await this.beforeSyncRun();
            if (!this.isRunCurrent(runGeneration)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            return await this.executeSyncLoop(runGeneration);
        } finally {
            await this.finishSyncRun(runGeneration);
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    interruptActiveRun(): void {
        this.runGeneration += 1;
        this.isRunning = false;
        this.runRequested = false;
        this.failedSyncId = null;
        this.processedForwardSyncIds.clear();
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
    @InvalidateDatabaseLiveQuery()
    override async updateAccountToken(accountId: number, token: string): Promise<void> {
        await this.beforeUpdateAccountToken();

        this.validateToken(token);

        await syncIntegrationTokenService.updateAccountToken(this.provider, accountId, token);
    }

    @Log(
        runGeneration => `enter runGeneration=${runGeneration}`,
        (result, runGeneration) => `done runGeneration=${runGeneration} result=${String(result)}`,
        (error, runGeneration) => `throw runGeneration=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected async executeSyncLoop(runGeneration: number): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            const enabledSyncs = await syncRepository.getEnabledByProvider(this.provider);
            if (!isNotEmptyArray(enabledSyncs)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            if (this.shouldStopProcessing(runGeneration)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            await this.beforeProcessRun(await this.resolveSyncToken(enabledSyncs[0]), runGeneration);
            if (this.shouldStopProcessing(runGeneration)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            return await this.processPendingSyncs(runGeneration);
        } catch (error: unknown) {
            return this.handleError(error, runGeneration);
        }
    }

    @Log(
        runGeneration => `enter runGeneration=${runGeneration}`,
        (result, runGeneration) => `done runGeneration=${runGeneration} result=${String(result)}`,
        (error, runGeneration) => `throw runGeneration=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected async processPendingSyncs(runGeneration: number): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.shouldStopProcessing(runGeneration)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const pendingSync = await this.getNextPendingSync(runGeneration);
        if (!this.isRunCurrent(runGeneration) || !isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        if (!(await this.processSyncBatch(pendingSync, runGeneration))) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        if (this.isRunWorkComplete()) {
            return await this.executeSyncLoop(runGeneration);
        }

        if ((await this.shouldYieldAfterBatch()) || this.shouldStopProcessing(runGeneration)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        return await this.executeSyncLoop(runGeneration);
    }

    @Log(
        runGeneration => `enter runGeneration=${runGeneration}`,
        (result, runGeneration) => `done runGeneration=${runGeneration} found=${String(isDefined(result))}`,
        (error, runGeneration) => `throw runGeneration=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected async getNextPendingSync(runGeneration: number): Promise<SyncEntityInterface | null> {
        const backwardSyncs = await syncRepository.getPendingBackwardSync(this.provider);
        const claimedBackwardSync = await this.claimPendingSync(backwardSyncs[0] ?? null, runGeneration);
        if (isDefined(claimedBackwardSync)) {
            return claimedBackwardSync;
        }

        const forwardSyncs = await syncRepository.getPendingForwardSync(
            this.provider,
            AbstractPollingSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        const forwardSync = forwardSyncs.find(sync => !this.processedForwardSyncIds.has(sync.id));

        return this.claimPendingSync(forwardSync ?? null, runGeneration);
    }

    @Log(
        (sync, result, runGeneration) =>
            `enter syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${String(result.completed)} runGeneration=${runGeneration}`,
        (_result, sync, result, runGeneration) =>
            `done syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} completed=${String(result.completed)} runGeneration=${runGeneration}`,
        (error, sync, result, runGeneration) =>
            `throw syncId=${sync.id} mode=${sync.mode} transactionCount=${result.transactions.length} runGeneration=${runGeneration} error=${getErrorMessage(error)}`
    )
    protected async applyProgressUpdate(
        sync: SyncEntityInterface,
        result: SyncBatchResultInterface,
        runGeneration: number
    ): Promise<void> {
        if (!this.isRunCurrent(runGeneration)) {
            return;
        }

        await syncRepository.updateProgress(sync.id, this.provider, sync.mode, this.resolveProgressUpdate(sync, result));
    }

    @Log(
        sync => `enter syncId=${sync.id} accountId=${sync.accountId}`,
        (result, sync) => `done syncId=${sync.id} accountId=${sync.accountId} tokenLen=${result.length}`,
        (error, sync) => `throw syncId=${sync.id} accountId=${sync.accountId} error=${getErrorMessage(error)}`
    )
    protected async resolveSyncToken(sync: SyncEntityInterface): Promise<string> {
        return syncIntegrationTokenService.resolveAccountToken(this.provider, sync.accountId);
    }

    @Log(
        (error, runGeneration) => `enter runGeneration=${runGeneration} error=${getErrorMessage(error)}`,
        (result, error, runGeneration) => `done runGeneration=${runGeneration} error=${getErrorMessage(error)} result=${String(result)}`,
        (hookError, error, runGeneration) =>
            `throw runGeneration=${runGeneration} error=${getErrorMessage(error)} hookError=${getErrorMessage(hookError)}`
    )
    private async handleError(error: unknown, runGeneration: number): Promise<BackgroundTask.BackgroundTaskResult> {
        if (!this.isRunCurrent(runGeneration)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = await syncRepository.getEnabledByProvider(this.provider);
        if (!this.isRunCurrent(runGeneration)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        return this.handleEnabledSyncError(error, errorMessage, enabledSyncs, runGeneration);
    }

    @Log(
        (enabledSyncs, credentialGroupSync) =>
            `enter enabledSyncIds=${enabledSyncs.map(sync => sync.id).join(',')} credentialGroupSyncId=${credentialGroupSync.id}`,
        (result, enabledSyncs, credentialGroupSync) =>
            `done enabledSyncIds=${enabledSyncs.map(sync => sync.id).join(',')} credentialGroupSyncId=${credentialGroupSync.id} groupedSyncIds=${result.map(sync => sync.id).join(',')}`,
        (error, enabledSyncs, credentialGroupSync) =>
            `throw enabledSyncIds=${enabledSyncs.map(sync => sync.id).join(',')} credentialGroupSyncId=${credentialGroupSync.id} error=${getErrorMessage(error)}`
    )
    private async resolveCredentialGroupSyncs(
        enabledSyncs: SyncEntityInterface[],
        credentialGroupSync: SyncEntityInterface
    ): Promise<SyncEntityInterface[]> {
        const accounts = await accountRepository.findByIds(enabledSyncs.map(sync => sync.accountId));
        const integrationIdByAccountId = new Map(accounts.map(account => [account.id, account.integrationId]));
        const credentialGroupIntegrationId = integrationIdByAccountId.get(credentialGroupSync.accountId);

        if (!isDefined(credentialGroupIntegrationId)) {
            return [credentialGroupSync];
        }

        return enabledSyncs.filter(sync => integrationIdByAccountId.get(sync.accountId) === credentialGroupIntegrationId);
    }

    @Log(
        (accountId, token, historyDepth, tx) =>
            `enter accountId=${accountId} tokenLen=${token.length} historyDepth=${historyDepth} hasTx=${String(isDefined(tx))}`,
        (result, accountId, token, historyDepth, tx) =>
            `done accountId=${accountId} tokenLen=${token.length} historyDepth=${historyDepth} hasTx=${String(isDefined(tx))} syncId=${result.id}`,
        (error, accountId, token, historyDepth, tx) =>
            `throw accountId=${accountId} tokenLen=${token.length} historyDepth=${historyDepth} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    protected async createOrUpdateSync(
        accountId: number,
        token: string,
        historyDepth = SyncHistoryDepthEnum.FULL,
        tx?: DB
    ): Promise<SyncEntityInterface> {
        const now = new Date();
        const backwardSyncLimitAt = this.resolveBackwardSyncLimit(historyDepth, now);
        const integration = await syncIntegrationTokenService.getOrCreateIntegration(this.provider, token, tx);
        await accountRepository.updateById(accountId, { integrationId: integration.id }, tx);

        const existingSync = await syncRepository.getByAccountId(accountId, tx);
        if (isDefined(existingSync)) {
            return syncRepository.update(
                existingSync.id,
                {
                    enabled: true,
                    errorCount: 0,
                    lastError: null,
                    backwardSyncLimitAt,
                    backwardBatchSequence: null,
                    balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
                    balanceAnchorCapturedAt: now
                },
                tx
            );
        }

        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(accountId, tx);

        return syncRepository.create(
            {
                accountId,
                provider: this.provider,
                enabled: true,
                mode: SyncModeEnum.BACKWARD,
                status: SyncStatusEnum.SYNCING,
                backwardSyncFromAt: now,
                backwardSyncedAt: earliestTransactionTime,
                backwardSyncLimitAt,
                forwardSyncFromAt: now,
                forwardSyncedAt: null,
                balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
                balanceAnchorCapturedAt: now
            },
            tx
        );
    }

    protected async beforeProcessRun(_firstSyncToken: string, _runGeneration: number): Promise<void> {
        return Promise.resolve();
    }

    protected isRunCurrent(runGeneration: number): boolean {
        return this.isRunning && runGeneration === this.runGeneration;
    }

    protected async beforeUpdateAccountToken(): Promise<void> {
        return Promise.resolve();
    }

    protected async afterSyncRun(): Promise<void> {
        return Promise.resolve();
    }

    protected isRunWorkComplete(): boolean {
        return false;
    }

    protected validateToken(token: string): void {
        if (!isDefined(token)) {
            throw new Error(UNKNOWN_SYNC_ERROR);
        }
    }

    protected isRetryableError(_error: unknown): boolean {
        return true;
    }

    protected isCredentialWideError(_error: unknown): boolean {
        return false;
    }

    protected shouldKeepSyncsEnabledAfterError(_error: unknown): boolean {
        return false;
    }

    private async claimPendingSync(sync: SyncEntityInterface | null, runGeneration: number): Promise<SyncEntityInterface | null> {
        if (!this.isRunCurrent(runGeneration) || !isDefined(sync)) {
            return null;
        }

        await syncRepository.setStatus(sync.id, SyncStatusEnum.SYNCING);

        return sync;
    }

    private async handleEnabledSyncError(
        error: unknown,
        errorMessage: string,
        enabledSyncs: SyncEntityInterface[],
        runGeneration: number
    ): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRetryableError(error) && (await this.retryAfterError(enabledSyncs, errorMessage, runGeneration))) {
            return this.executeSyncLoop(runGeneration);
        }

        if (!this.isRunCurrent(runGeneration)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        if (this.shouldKeepSyncsEnabledAfterError(error)) {
            await this.recordSyncsFailedWithoutDisabling(enabledSyncs, errorMessage);

            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        await this.disableFailedSyncs(enabledSyncs, error, errorMessage);

        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    private resolveBackwardSyncLimit(historyDepth: SyncHistoryDepthEnum, anchor: Date): Date | null {
        const months = AbstractPollingSyncService.BACKWARD_SYNC_LIMIT_MONTHS[historyDepth];

        return isDefined(months) ? subMonths(anchor, months) : null;
    }

    private startSyncRun(deadlineAtMs: number): number {
        this.runGeneration += 1;
        this.isRunning = true;
        this.runRequested = false;
        this.runDeadlineAtMs = deadlineAtMs;
        this.runDeferred = false;
        this.failedSyncId = null;
        this.processedForwardSyncIds.clear();

        return this.runGeneration;
    }

    private async finishSyncRun(runGeneration: number): Promise<void> {
        if (!this.isRunCurrent(runGeneration)) {
            return;
        }

        try {
            await this.afterSyncRun();
        } catch (error: unknown) {
            this.completeSyncRun(runGeneration);

            throw error;
        }

        this.completeSyncRun(runGeneration);
    }

    private completeSyncRun(runGeneration: number): void {
        if (!this.isRunCurrent(runGeneration)) {
            return;
        }

        const shouldScheduleFollowUp = this.runRequested;
        this.failedSyncId = null;
        this.processedForwardSyncIds.clear();
        this.runRequested = false;
        this.isRunning = false;
        if (shouldScheduleFollowUp) {
            syncWorkloadService.run(`${this.provider}-follow-up`, () => this.sync()).catch(emptyFn);
        }
    }

    private async retryAfterError(enabledSyncs: SyncEntityInterface[], errorMessage: string, runGeneration: number): Promise<boolean> {
        const failedSync = enabledSyncs.find(sync => sync.id === this.failedSyncId);
        const syncToRetry = failedSync ?? enabledSyncs[0];
        if (!this.isRunCurrent(runGeneration) || !isDefined(syncToRetry) || syncToRetry.errorCount >= SYNC_ERROR_THRESHOLD) {
            return false;
        }

        await syncRepository.recordError(syncToRetry.id, errorMessage);
        if (!this.isRunCurrent(runGeneration)) {
            return false;
        }

        await microPause(this.rateLimitMs);

        return this.isRunCurrent(runGeneration);
    }

    private async disableFailedSyncs(enabledSyncs: SyncEntityInterface[], error: unknown, errorMessage: string): Promise<void> {
        const disableSyncPromises: Array<Promise<unknown>> = [];
        for (const sync of await this.resolveSyncsToDisable(enabledSyncs, error)) {
            disableSyncPromises.push(
                syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage, enabled: false })
            );
        }

        await Promise.all(disableSyncPromises);
    }

    private async recordSyncsFailedWithoutDisabling(enabledSyncs: SyncEntityInterface[], errorMessage: string): Promise<void> {
        const updateSyncPromises: Array<Promise<unknown>> = [];
        for (const sync of enabledSyncs) {
            updateSyncPromises.push(syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage }));
        }

        await Promise.all(updateSyncPromises);
    }

    private async resolveSyncsToDisable(enabledSyncs: SyncEntityInterface[], error: unknown): Promise<SyncEntityInterface[]> {
        const failedSync = enabledSyncs.find(sync => sync.id === this.failedSyncId);
        if (this.isCredentialWideError(error)) {
            return this.resolveCredentialGroupSyncs(enabledSyncs, failedSync ?? enabledSyncs[0]);
        }

        return isDefined(failedSync) ? [failedSync] : [enabledSyncs[0]];
    }

    private shouldStopProcessing(runGeneration: number): boolean {
        return !this.isRunCurrent(runGeneration) || this.runDeferred || Date.now() >= this.runDeadlineAtMs;
    }

    private async processSyncBatch(pendingSync: SyncEntityInterface, runGeneration: number): Promise<boolean> {
        this.failedSyncId = pendingSync.id;
        const result = await this.executeSyncBatch(pendingSync, runGeneration);
        if (!this.isRunCurrent(runGeneration)) {
            return false;
        }

        await this.applyProgressUpdate(pendingSync, result, runGeneration);
        if (!this.isRunCurrent(runGeneration)) {
            return false;
        }

        this.recordProcessedSyncBatch(pendingSync, result);
        this.failedSyncId = null;

        return true;
    }

    private async shouldYieldAfterBatch(): Promise<boolean> {
        return this.shouldYieldToQueuedWork() || (await this.shouldYieldAfterRateLimit());
    }

    private async shouldYieldAfterRateLimit(): Promise<boolean> {
        if (!(await syncWorkloadService.waitForQueuedUserWork(this.rateLimitMs))) {
            return false;
        }

        return true;
    }

    private shouldYieldToQueuedWork(): boolean {
        return syncWorkloadService.hasQueuedWork();
    }

    private recordProcessedSyncBatch(pendingSync: SyncEntityInterface, result: SyncBatchResultInterface): void {
        if (pendingSync.mode === SyncModeEnum.FORWARD && result.completed) {
            this.processedForwardSyncIds.add(pendingSync.id);
        }
    }

    private resolveProgressUpdate(sync: SyncEntityInterface, result: SyncBatchResultInterface): SyncUpdateEntityInterface {
        const now = new Date();
        const transactionCount = result.transactionCount ?? result.transactions.length;
        const baseUpdate = { transactionCount: sync.transactionCount + transactionCount, errorCount: 0, lastError: null };

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
            const nextBackwardSyncedAt = isPositiveNumber(transactionCount) ? null : (sync.backwardSyncedAt ?? result.nextTo);

            return { ...baseUpdate, backwardSyncedAt: nextBackwardSyncedAt, backwardSyncFromAt: result.nextTo };
        }

        return { ...baseUpdate, forwardSyncFromAt: result.nextFrom };
    }

    abstract fetchAccountsPreview(token: string): Promise<SyncAccountPreviewInterface[]>;

    abstract setupAccountSyncBatch(token: string, externalIds: string[]): Promise<unknown>;

    protected abstract executeSyncBatch(sync: SyncEntityInterface, runGeneration: number): Promise<SyncBatchResultInterface>;

    protected abstract beforeSyncRun(): Promise<void>;
}
