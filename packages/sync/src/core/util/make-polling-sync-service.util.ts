import { AccountRepository, SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import { SyncWorkload } from '../port/sync-workload.port';
import { PollingSyncRateGate } from '../service/polling-sync-rate-gate.service';
import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';

import { makeSyncService } from './make-sync-service.util';
import { resolveSyncProgressUpdate } from './resolve-sync-progress-update.util';

import type { PollingSyncServiceDefinitionInterface } from '../interface/polling-sync-service-definition.interface';
import type { SyncBatchResultInterface } from '../interface/sync-batch-result.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

export const makePollingSyncService = Effect.fnUntraced(function* (definition: PollingSyncServiceDefinitionInterface) {
    const syncWorkload = yield* SyncWorkload;
    const syncRepository = yield* SyncRepository;
    const accountRepository = yield* AccountRepository;
    const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
    const rateGate = yield* Effect.provide(PollingSyncRateGate, Layer.fresh(PollingSyncRateGate.layer));
    const attemptSemaphore = yield* Semaphore.make(1);
    const forwardSyncStaleThresholdMs = 2 * 60 * 1000;
    const syncErrorThreshold = 3;
    const processedForwardSyncIds = new Set<number>();
    const applyProgressUpdate =
        definition.applyProgressUpdate ??
        ((sync: SyncEntityInterface, result: SyncBatchResultInterface) =>
            Effect.asVoid(syncRepository.update(sync.id, resolveSyncProgressUpdate(sync, result))));
    let runDeadlineAtMs = Number.POSITIVE_INFINITY;
    let failedSyncId: number | null = null;
    let nextContinuationAtMs: number | null = null;

    const shouldStopProcessing = Effect.map(
        Clock.currentTimeMillis,
        nowMs => definition.isRunDeferred?.() === true || nowMs >= runDeadlineAtMs
    );

    const sleepWithinDeadline = Effect.flatMap(Clock.currentTimeMillis, nowMs =>
        Effect.sleep(Math.min(definition.rateLimitMs, Math.max(0, runDeadlineAtMs - nowMs)))
    );

    const resolveSyncToken = (sync: SyncEntityInterface) =>
        syncIntegrationTokenService.resolveAccountToken(definition.provider, sync.accountId);

    const claimPendingSync = Effect.fnUntraced(function* (sync: SyncEntityInterface) {
        yield* syncRepository.setStatus(sync.id, SyncStatusEnum.SYNCING);

        return sync;
    });

    const getNextPendingSync = Effect.fnUntraced(function* () {
        const [backwardSync] = yield* syncRepository.getPendingBackwardSync(definition.provider);
        if (isDefined(backwardSync)) {
            return yield* claimPendingSync(backwardSync);
        }

        const forwardSyncs = yield* syncRepository.getPendingForwardSync(definition.provider, forwardSyncStaleThresholdMs);
        const forwardSync = forwardSyncs.find(sync => !processedForwardSyncIds.has(sync.id));

        return isDefined(forwardSync) ? yield* claimPendingSync(forwardSync) : null;
    });

    const processPendingSync = Effect.fnUntraced(function* (pendingSync: SyncEntityInterface) {
        failedSyncId = pendingSync.id;
        const token = yield* resolveSyncToken(pendingSync);
        const nextRequestAtMs = yield* rateGate.waitForRequest(token, runDeadlineAtMs);
        if (isDefined(nextRequestAtMs)) {
            if (!Number.isFinite(runDeadlineAtMs)) {
                nextContinuationAtMs = nextRequestAtMs;
            }

            return false;
        }

        if (yield* shouldStopProcessing) {
            return false;
        }

        const result = yield* Effect.ensuring(
            definition.executeSyncBatch(pendingSync, token),
            rateGate.recordCompletion(token, definition.rateLimitMs)
        );
        yield* applyProgressUpdate(pendingSync, result);
        if (pendingSync.mode === SyncModeEnum.FORWARD && result.completed) {
            processedForwardSyncIds.add(pendingSync.id);
        }
        failedSyncId = null;

        return true;
    });

    const shouldYieldAfterBatch = Effect.fnUntraced(function* () {
        const shouldYield = yield* rateGate.shouldYieldAfterBatch(runDeadlineAtMs, definition.rateLimitMs);
        if (shouldYield && !Number.isFinite(runDeadlineAtMs)) {
            nextContinuationAtMs = yield* rateGate.lastRequestReadyAtMs;
        }

        return shouldYield;
    });

    const runSyncPass = Effect.fnUntraced(function* () {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs) || (yield* shouldStopProcessing)) {
            return true;
        }

        yield* (definition.beforeProcessRun ?? (() => Effect.void))(yield* resolveSyncToken(enabledSyncs[0]));
        if (yield* shouldStopProcessing) {
            return true;
        }

        const pendingSync = yield* getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return true;
        }

        if (!(yield* processPendingSync(pendingSync))) {
            return true;
        }

        const isRunFinished =
            definition.isRunWorkComplete?.() !== true && ((yield* shouldYieldAfterBatch()) || (yield* shouldStopProcessing));

        return isRunFinished ? true : null;
    });

    const retryAfterError = Effect.fnUntraced(function* (enabledSyncs: SyncEntityInterface[], errorMessage: string) {
        const syncToRetry = enabledSyncs.find(sync => sync.id === failedSyncId) ?? enabledSyncs[0];
        if (!isDefined(syncToRetry) || syncToRetry.errorCount >= syncErrorThreshold) {
            return false;
        }

        yield* syncRepository.recordError(syncToRetry.id, errorMessage);
        yield* sleepWithinDeadline;

        return true;
    });

    const resolveSyncsToDisable = Effect.fnUntraced(function* (enabledSyncs: SyncEntityInterface[], error: unknown) {
        const failedSync = enabledSyncs.find(sync => sync.id === failedSyncId);
        if (definition.isCredentialWideError?.(error) !== true) {
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

    const handleError = Effect.fnUntraced(function* (error: unknown) {
        if (error instanceof SyncRateLimitedError) {
            return (yield* shouldYieldAfterBatch()) ? true : null;
        }

        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return false;
        }

        if (definition.isRetryableError?.(error) !== false && (yield* retryAfterError(enabledSyncs, errorMessage))) {
            return null;
        }

        if (definition.shouldKeepSyncsEnabledAfterError?.(error) === true) {
            yield* Effect.forEach(
                enabledSyncs,
                sync => syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage }),
                { discard: true }
            );

            return false;
        }

        yield* Effect.forEach(
            yield* resolveSyncsToDisable(enabledSyncs, error),
            sync => syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage, enabled: false }),
            { discard: true }
        );

        return false;
    });

    const runSyncLoop = Effect.fnUntraced(function* () {
        yield* definition.beforeSyncRun(runDeadlineAtMs);

        let result: boolean | null = null;
        while (!isDefined(result)) {
            result = yield* runSyncPass().pipe(
                Effect.catchCause(cause => (Cause.hasInterruptsOnly(cause) ? Effect.failCause(cause) : handleError(Cause.squash(cause))))
            );
        }

        return result;
    });

    const runSyncAttempt = Effect.fnUntraced(function* (deadlineAtMs: number) {
        runDeadlineAtMs = deadlineAtMs;
        failedSyncId = null;
        nextContinuationAtMs = null;
        processedForwardSyncIds.clear();

        const result = yield* Effect.ensuring(
            runSyncLoop(),
            Effect.sync(() => {
                definition.afterSyncRun?.();
            })
        );

        const continuationAtMs = nextContinuationAtMs;
        if (!isDefined(continuationAtMs)) {
            return { result, continuationAtMs };
        }

        const pendingBackwardSyncs = yield* syncRepository.getPendingBackwardSync(definition.provider);

        return { result, continuationAtMs: isNotEmptyArray(pendingBackwardSyncs) || isDefined(failedSyncId) ? continuationAtMs : null };
    });

    const runContinuation = Effect.fnUntraced(function* (firstContinuationAtMs: number) {
        let continuationAtMs: number | null = firstContinuationAtMs;
        while (isDefined(continuationAtMs)) {
            yield* Effect.sleep(Math.max(0, continuationAtMs - (yield* Clock.currentTimeMillis)));
            const outcome = yield* syncWorkload.runScheduled(
                Effect.gen(function* () {
                    if (yield* syncWorkload.hasQueuedUserWork) {
                        return { continuationAtMs: yield* Clock.currentTimeMillis };
                    }

                    return yield* attemptSemaphore.withPermit(runSyncAttempt(Number.POSITIVE_INFINITY));
                })
            );
            ({ continuationAtMs } = outcome);
        }
    });

    const sync = Effect.fn('AbstractPollingSyncService.sync')(function* (deadlineAtMs: number = Number.POSITIVE_INFINITY) {
        const outcome = yield* attemptSemaphore.withPermit(runSyncAttempt(deadlineAtMs));
        const { continuationAtMs } = outcome;
        if (isDefined<number>(continuationAtMs)) {
            yield* syncWorkload.schedule(
                `sync:${definition.provider}`,
                runContinuation(continuationAtMs).pipe(Effect.ignoreCause({ log: true }))
            );
        }

        return outcome.result;
    });

    const requestSync = Effect.fnUntraced(function* () {
        yield* Effect.forkDetach(syncWorkload.run(sync()).pipe(Effect.ignoreCause({ log: true })));
    });

    const syncService = yield* makeSyncService({
        ...definition,
        ...(definition.shouldRequestSyncWhenEnabled === true && {
            afterSyncEnabledChange: (enabled: boolean) => (enabled ? requestSync() : Effect.void)
        })
    });

    return {
        ...syncService,
        sync,
        requestSync,
        updateAccountToken: Effect.fn('AbstractPollingSyncService.updateAccountToken')(function* (accountId: number, token: string) {
            yield* (definition.validateToken ?? (() => Effect.void))(token);
            yield* syncIntegrationTokenService.updateAccountToken(definition.provider, accountId, token);
        })
    };
});
