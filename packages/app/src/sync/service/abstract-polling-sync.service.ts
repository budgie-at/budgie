import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { subMonths } from 'date-fns/subMonths';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { accountRepository, syncRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { Workload } from '../../@generic/service/workload.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { SYNC_ERROR_THRESHOLD } from '../constant/sync-error-threshold.constant';
import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';

import { AbstractSyncService } from './abstract-sync.service';
import { syncIntegrationTokenService } from './sync-integration-token.service';

import type { Db, SyncEntityInterface, SyncUpdateEntityInterface } from '@budgie/contracts';
import type { SyncBatchResultInterface } from '@budgie/sync';
import type * as HttpClient from 'effect/http/HttpClient';
import type * as Schema from 'effect/Schema';

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

    readonly sync = Effect.fn('AbstractPollingSyncService.sync')(function* (
        this: AbstractPollingSyncService,
        deadlineAtMs: number = Number.POSITIVE_INFINITY
    ) {
        this.runDeadlineAtMs = deadlineAtMs;
        this.runDeferred = false;
        this.failedSyncId = null;
        this.processedForwardSyncIds.clear();

        return yield* Effect.ensuring(
            this.runSyncLoop(),
            Effect.sync(() => {
                this.afterSyncRun();
            })
        );
    });

    readonly registerBackgroundTask = Effect.fn('AbstractPollingSyncService.registerBackgroundTask')(
        function* (this: AbstractPollingSyncService) {
            if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(this.backgroundTaskName))) {
                yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(this.backgroundTaskName));
            }
            yield* Effect.promise(() =>
                BackgroundTask.registerTaskAsync(this.backgroundTaskName, {
                    minimumInterval: AbstractPollingSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
                })
            );
        }
    );

    readonly updateAccountToken = Effect.fn('AbstractPollingSyncService.updateAccountToken')(function* (
        this: AbstractPollingSyncService,
        accountId: number,
        token: string
    ) {
        yield* this.validateToken(token);
        yield* syncIntegrationTokenService.updateAccountToken(this.provider, accountId, token);
    }, invalidateDatabaseLiveQuery);

    protected readonly requestSync = Effect.fnUntraced(function* (this: AbstractPollingSyncService) {
        yield* Effect.forkDetach(Workload.use(workload => workload.run(this.sync())).pipe(Effect.ignoreCause({ log: true })));
    });

    protected readonly resolveSyncToken = Effect.fnUntraced(function* (this: AbstractPollingSyncService, sync: SyncEntityInterface) {
        return yield* syncIntegrationTokenService.resolveAccountToken(this.provider, sync.accountId);
    });

    protected runDeadlineAtMs = Number.POSITIVE_INFINITY;
    protected runDeferred = false;

    private readonly runSyncLoop = Effect.fnUntraced(function* (this: AbstractPollingSyncService) {
        yield* this.beforeSyncRun();

        let result: BackgroundTask.BackgroundTaskResult | null = null;
        while (!isDefined(result)) {
            result = yield* this.runSyncPass().pipe(
                Effect.catchCause(cause =>
                    Cause.hasInterruptsOnly(cause) ? Effect.failCause(cause) : this.handleError(Cause.squash(cause))
                )
            );
        }

        return result;
    });

    private readonly runSyncPass = Effect.fnUntraced(function* (this: AbstractPollingSyncService) {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs) || this.shouldStopProcessing()) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        yield* this.beforeProcessRun(yield* this.resolveSyncToken(enabledSyncs[0]));
        if (this.shouldStopProcessing()) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const pendingSync = yield* this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        yield* this.processPendingSync(pendingSync);

        const isRunFinished = !this.isRunWorkComplete() && ((yield* this.shouldYieldAfterBatch()) || this.shouldStopProcessing());

        return isRunFinished ? BackgroundTask.BackgroundTaskResult.Success : null;
    });

    private readonly processPendingSync = Effect.fnUntraced(function* (this: AbstractPollingSyncService, pendingSync: SyncEntityInterface) {
        this.failedSyncId = pendingSync.id;
        const result = yield* this.executeSyncBatch(pendingSync);
        yield* this.applyProgressUpdate(pendingSync, result);
        if (pendingSync.mode === SyncModeEnum.FORWARD && result.completed) {
            this.processedForwardSyncIds.add(pendingSync.id);
        }
        this.failedSyncId = null;
    });

    private readonly getNextPendingSync = Effect.fnUntraced(function* (this: AbstractPollingSyncService) {
        const [backwardSync] = yield* syncRepository.getPendingBackwardSync(this.provider);
        if (isDefined(backwardSync)) {
            return yield* this.claimPendingSync(backwardSync);
        }

        const forwardSyncs = yield* syncRepository.getPendingForwardSync(
            this.provider,
            AbstractPollingSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        const forwardSync = forwardSyncs.find(sync => !this.processedForwardSyncIds.has(sync.id));

        return isDefined(forwardSync) ? yield* this.claimPendingSync(forwardSync) : null;
    });

    private readonly claimPendingSync = Effect.fnUntraced(function* (sync: SyncEntityInterface) {
        yield* syncRepository.setStatus(sync.id, SyncStatusEnum.SYNCING);

        return sync;
    });

    private readonly shouldYieldAfterBatch = Effect.fnUntraced(function* (this: AbstractPollingSyncService) {
        const workload = yield* Workload;
        if (yield* workload.hasQueuedWork) {
            return true;
        }

        return yield* Effect.raceFirst(Effect.as(Effect.sleep(this.rateLimitMs), false), Effect.as(workload.awaitQueuedUserWork, true));
    });

    private readonly handleError = Effect.fnUntraced(function* (this: AbstractPollingSyncService, error: unknown) {
        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        if (this.isRetryableError(error) && (yield* this.retryAfterError(enabledSyncs, errorMessage))) {
            return null;
        }

        if (this.shouldKeepSyncsEnabledAfterError(error)) {
            yield* Effect.forEach(
                enabledSyncs,
                sync => syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage }),
                { discard: true }
            );

            return BackgroundTask.BackgroundTaskResult.Failed;
        }

        yield* Effect.forEach(
            yield* this.resolveSyncsToDisable(enabledSyncs, error),
            sync => syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage, enabled: false }),
            { discard: true }
        );

        return BackgroundTask.BackgroundTaskResult.Failed;
    });

    private readonly retryAfterError = Effect.fnUntraced(function* (
        this: AbstractPollingSyncService,
        enabledSyncs: SyncEntityInterface[],
        errorMessage: string
    ) {
        const syncToRetry = enabledSyncs.find(sync => sync.id === this.failedSyncId) ?? enabledSyncs[0];
        if (!isDefined(syncToRetry) || syncToRetry.errorCount >= SYNC_ERROR_THRESHOLD) {
            return false;
        }

        yield* syncRepository.recordError(syncToRetry.id, errorMessage);
        yield* Effect.sleep(this.rateLimitMs);

        return true;
    });

    private readonly resolveSyncsToDisable = Effect.fnUntraced(function* (
        this: AbstractPollingSyncService,
        enabledSyncs: SyncEntityInterface[],
        error: unknown
    ) {
        const failedSync = enabledSyncs.find(sync => sync.id === this.failedSyncId);
        if (!this.isCredentialWideError(error)) {
            return isDefined(failedSync) ? [failedSync] : enabledSyncs.slice(0, 1);
        }

        const credentialGroupSync = failedSync ?? enabledSyncs[0];
        const accounts = yield* accountRepository.findByIds(enabledSyncs.map(sync => sync.accountId));
        const integrationIdByAccountId = new Map(accounts.map(account => [account.id, account.integrationId]));
        const credentialGroupIntegrationId = isDefined(credentialGroupSync)
            ? integrationIdByAccountId.get(credentialGroupSync.accountId)
            : null;

        if (!isDefined(credentialGroupIntegrationId)) {
            return isDefined(credentialGroupSync) ? [credentialGroupSync] : [];
        }

        return enabledSyncs.filter(sync => integrationIdByAccountId.get(sync.accountId) === credentialGroupIntegrationId);
    });

    private failedSyncId: number | null = null;
    private readonly processedForwardSyncIds = new Set<number>();

    protected abstract readonly rateLimitMs: number;
    protected abstract readonly backgroundTaskName: string;
    protected abstract readonly executeSyncBatch: (
        sync: SyncEntityInterface
    ) => Effect.Effect<SyncBatchResultInterface, unknown, Db | HttpClient.HttpClient | Workload>;

    protected abstract readonly beforeSyncRun: () => Effect.Effect<void, unknown, Db>;

    protected beforeProcessRun(_firstSyncToken: string): Effect.Effect<void, unknown, Db | HttpClient.HttpClient | Workload> {
        return Effect.void;
    }

    protected createOrUpdateSync(
        accountId: number,
        token: string,
        historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL,
        setupBalance: number | null = null
    ) {
        const { provider } = this;
        const now = new Date();
        const backwardSyncLimitAt = this.resolveBackwardSyncLimit(historyDepth, now);

        return Effect.gen(function* () {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
            yield* accountRepository.updateById(accountId, { integrationId: integration.id });

            const existingSync = yield* syncRepository.getByAccountId(accountId);
            if (isDefined(existingSync)) {
                yield* syncRepository.update(existingSync.id, { enabled: true, errorCount: 0, lastError: null, backwardSyncLimitAt });

                return;
            }

            const earliestTransactionTime = yield* transactionService.getEarliestTransactionTimeByAccountId(accountId);
            yield* syncRepository.create({
                accountId,
                provider,
                enabled: true,
                mode: SyncModeEnum.BACKWARD,
                status: SyncStatusEnum.SYNCING,
                backwardSyncFromAt: now,
                backwardSyncedAt: earliestTransactionTime ?? null,
                backwardSyncLimitAt,
                forwardSyncFromAt: now,
                forwardSyncedAt: null,
                setupBalance
            });
        });
    }

    protected applyProgressUpdate(
        sync: SyncEntityInterface,
        result: SyncBatchResultInterface
    ): Effect.Effect<void, unknown, Db | HttpClient.HttpClient | Workload> {
        return Effect.asVoid(syncRepository.update(sync.id, this.resolveProgressUpdate(sync, result)));
    }

    protected resolveProgressUpdate(sync: SyncEntityInterface, result: SyncBatchResultInterface): SyncUpdateEntityInterface {
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

            return { ...baseUpdate, backwardSyncedAt: nextBackwardSyncedAt, backwardSyncFromAt: result.nextTo, backwardBatchAt: now };
        }

        return { ...baseUpdate, forwardSyncFromAt: result.nextFrom };
    }

    protected afterSyncRun(): void {
        return void 0;
    }

    protected isRunWorkComplete(): boolean {
        return false;
    }

    protected validateToken(_token: string): Effect.Effect<unknown, Schema.SchemaError> {
        return Effect.void;
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

    private resolveBackwardSyncLimit(historyDepth: SyncHistoryDepthEnum, anchor: Date): Date | null {
        const months = AbstractPollingSyncService.BACKWARD_SYNC_LIMIT_MONTHS[historyDepth];

        return isDefined(months) ? subMonths(anchor, months) : null;
    }

    private shouldStopProcessing(): boolean {
        return this.runDeferred || Date.now() >= this.runDeadlineAtMs;
    }
}
