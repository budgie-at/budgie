import { AccountRepository, SyncErrorCodeEnum, SyncModeEnum, SyncRepository, SyncStatusEnum, SyncWarningEnum } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Predicate from 'effect/Predicate';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import { SyncWorkload } from '../port/sync-workload.port';
import { PollingSyncRateGate } from '../service/polling-sync-rate-gate.service';
import { SyncIntegrationTokenService } from '../service/sync-integration-token.service';

import { makeSyncService } from './make-sync-service.util';
import { resolveSyncErrorCode } from './resolve-sync-error-code.util';
import { resolveSyncProgressUpdate } from './resolve-sync-progress-update.util';

import type { PollingSyncServiceDefinitionInterface } from '../interface/polling-sync-service-definition.interface';
import type { SyncBatchResultInterface } from '../interface/sync-batch-result.interface';
import type { SyncEntityInterface, SyncUpdateEntityInterface } from '@budgie/contracts';

export const makePollingSyncService = Effect.fnUntraced(function* (definition: PollingSyncServiceDefinitionInterface) {
    const syncWorkload = yield* SyncWorkload;
    const syncRepository = yield* SyncRepository;
    const accountRepository = yield* AccountRepository;
    const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
    const rateGate = yield* PollingSyncRateGate.make;
    const attemptSemaphore = yield* Semaphore.make(1);
    const forwardSyncStaleThresholdMs = definition.forwardSyncStaleThresholdMs ?? 2 * 60 * 1000;
    const processedForwardSyncIds = new Set<number>();
    const exhaustedSyncIds = new Set<number>();
    const isNotExhausted = (sync: SyncEntityInterface) => !exhaustedSyncIds.has(sync.id);
    const applyProgressUpdate =
        definition.applyProgressUpdate ??
        ((sync: SyncEntityInterface, result: SyncBatchResultInterface) =>
            Effect.flatMap(DateTime.nowAsDate, now => syncRepository.update(sync.id, resolveSyncProgressUpdate(sync, result, now))));
    let runDeadlineAtMs = Number.POSITIVE_INFINITY;
    let failedSyncId: number | null = null;
    let nextContinuationAtMs: number | null = null;

    const shouldStopProcessing = Effect.map(
        Clock.currentTimeMillis,
        nowMs => definition.isRunDeferred?.() === true || nowMs >= runDeadlineAtMs || rateGate.isBackedOff(nowMs)
    );

    const sleepWithinDeadline = Effect.flatMap(Clock.currentTimeMillis, nowMs =>
        Effect.sleep(Math.min(definition.rateLimitMs, Math.max(0, runDeadlineAtMs - nowMs)))
    );

    const resolveSyncToken = (sync: SyncEntityInterface) =>
        syncIntegrationTokenService.resolveAccountToken(definition.provider, sync.accountId);

    const getNextPendingSync = Effect.fnUntraced(function* () {
        const isBackwardSkipped = definition.isBackwardForegroundOnly === true && Number.isFinite(runDeadlineAtMs);
        const backwardSyncs = isBackwardSkipped ? [] : yield* syncRepository.getPendingBackwardSync(definition.provider);
        const forwardSyncs = yield* syncRepository.getPendingForwardSync(definition.provider, forwardSyncStaleThresholdMs);
        const nowMs = yield* Clock.currentTimeMillis;
        let pendingSync: SyncEntityInterface | null = null;
        let earliestRequestAtMs = Number.POSITIVE_INFINITY;
        const candidates = [...backwardSyncs, ...forwardSyncs.filter(sync => !processedForwardSyncIds.has(sync.id))].filter(isNotExhausted);
        for (const sync of candidates) {
            const requestReadyAtMs = yield* Effect.flatMap(resolveSyncToken(sync), syncToken => rateGate.requestReadyAtMs(syncToken));
            const requestAtMs = Math.max(nowMs, requestReadyAtMs);
            if (requestAtMs < earliestRequestAtMs) {
                pendingSync = sync;
                earliestRequestAtMs = requestAtMs;
            }
            if (requestAtMs === nowMs) {
                break;
            }
        }

        if (isDefined(pendingSync)) {
            yield* syncRepository.setStatus(pendingSync.id, SyncStatusEnum.SYNCING);
        }

        return pendingSync;
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

    const shouldYieldAfterBatch = Effect.fnUntraced(function* (rateLimitMs: number = definition.rateLimitMs) {
        const shouldYield = yield* rateGate.shouldYieldAfterBatch(runDeadlineAtMs, rateLimitMs);
        if (shouldYield && !Number.isFinite(runDeadlineAtMs)) {
            nextContinuationAtMs = rateLimitMs === 0 ? yield* Clock.currentTimeMillis : yield* rateGate.lastRequestReadyAtMs;
        }

        return shouldYield;
    });

    const runSyncPass = Effect.fnUntraced(function* () {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs) || (yield* shouldStopProcessing)) {
            return true;
        }

        if (isDefined(definition.beforeProcessRun)) {
            const syncTokens = yield* Effect.forEach(enabledSyncs, resolveSyncToken);
            yield* definition.beforeProcessRun([...new Set(syncTokens)]);
            if (yield* shouldStopProcessing) {
                return true;
            }
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
        if (!isDefined(syncToRetry) || syncToRetry.errorCount >= 3) {
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

    const handleError = Effect.fnUntraced(function* (cause: Cause.Cause<unknown>) {
        const error = Cause.squash(cause);
        if (Schema.is(SyncRateLimitedError)(error)) {
            return (yield* shouldYieldAfterBatch(error.retryAfterMs)) ? true : null;
        }

        const errorMessage = getErrorMessage(error, UNKNOWN_SYNC_ERROR);
        const lastErrorCode = resolveSyncErrorCode(error);
        const markFailed = (sync: SyncEntityInterface, patch: SyncUpdateEntityInterface) =>
            syncRepository.update(sync.id, { status: SyncStatusEnum.FAILED, lastError: errorMessage, lastErrorCode, ...patch });
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return false;
        }

        if (definition.isRetryableError?.(error) !== false && (yield* retryAfterError(enabledSyncs, errorMessage))) {
            return null;
        }

        if (definition.shouldKeepSyncsEnabledAfterError?.(error) === true) {
            const regionWarning =
                lastErrorCode === SyncErrorCodeEnum.REGION_UNAVAILABLE ? { lastWarning: SyncWarningEnum.REGION_UNAVAILABLE } : {};
            yield* Effect.forEach(enabledSyncs, sync => markFailed(sync, regionWarning), { discard: true });

            return false;
        }

        const failedSyncs = yield* resolveSyncsToDisable(enabledSyncs, error);
        const keepEnabled = definition.shouldKeepFailedSyncEnabledAfterError?.(error) === true;
        yield* Effect.forEach(failedSyncs, sync => markFailed(sync, { enabled: keepEnabled }), { discard: true });

        if (keepEnabled && isNotEmptyArray(failedSyncs)) {
            failedSyncs.forEach(sync => exhaustedSyncIds.add(sync.id));
            failedSyncId = null;

            return (yield* shouldYieldAfterBatch(0)) ? true : null;
        }

        return false;
    });

    const runSyncLoop = Effect.fnUntraced(function* () {
        yield* definition.beforeSyncRun(runDeadlineAtMs);

        let result: boolean | null = null;
        while (!isDefined(result)) {
            result = yield* Effect.catchCauseIf(runSyncPass(), Predicate.not(Cause.hasInterruptsOnly), handleError);
        }

        return result && exhaustedSyncIds.size === 0;
    });

    const runSyncAttempt = Effect.fnUntraced(function* (deadlineAtMs: number) {
        runDeadlineAtMs = deadlineAtMs;
        failedSyncId = null;
        nextContinuationAtMs = null;
        processedForwardSyncIds.clear();
        exhaustedSyncIds.clear();

        const result = yield* runSyncLoop().pipe(Effect.ensuring(Effect.sync(() => definition.afterSyncRun?.())));

        const continuationAtMs = nextContinuationAtMs;
        if (!isDefined(continuationAtMs)) {
            return { result, continuationAtMs };
        }

        const hasPendingWork =
            isDefined(failedSyncId) ||
            (yield* syncRepository.getPendingBackwardSync(definition.provider)).some(isNotExhausted) ||
            (yield* syncRepository.getPendingForwardSync(definition.provider, forwardSyncStaleThresholdMs)).some(isNotExhausted);

        return { result, continuationAtMs: hasPendingWork ? continuationAtMs : null };
    });

    const runContinuation = Effect.fnUntraced(function* (firstContinuationAtMs: number) {
        let continuationAtMs: number | null = firstContinuationAtMs;
        while (isDefined(continuationAtMs)) {
            yield* Effect.sleep(Math.max(0, continuationAtMs - (yield* Clock.currentTimeMillis)));
            ({ continuationAtMs } = yield* syncWorkload.runScheduled(
                Effect.gen(function* () {
                    if (yield* syncWorkload.hasQueuedUserWork) {
                        return { continuationAtMs: yield* Clock.currentTimeMillis };
                    }

                    return yield* attemptSemaphore.withPermit(runSyncAttempt(Number.POSITIVE_INFINITY));
                })
            ));
        }
    });

    const sync = Effect.fn('AbstractPollingSyncService.sync')(function* (deadlineAtMs: number = Number.POSITIVE_INFINITY) {
        const { result, continuationAtMs } = yield* attemptSemaphore.withPermit(runSyncAttempt(deadlineAtMs));
        if (isDefined<number>(continuationAtMs)) {
            yield* syncWorkload.schedule(
                `sync:${definition.provider}`,
                runContinuation(continuationAtMs).pipe(Effect.ignoreCause({ log: true }))
            );
        }

        return result;
    });

    const requestSync = Effect.fnUntraced(function* () {
        yield* Effect.forkDetach(syncWorkload.run(sync()).pipe(Effect.ignoreCause({ log: true })));
    });

    const syncService = yield* makeSyncService(definition, enabled =>
        definition.shouldRequestSyncWhenEnabled === true && enabled ? requestSync() : Effect.void
    );

    return {
        ...syncService,
        sync,
        requestSync,
        updateAccountToken: Effect.fn('AbstractPollingSyncService.updateAccountToken')(function* (accountId: number, token: string) {
            yield* syncIntegrationTokenService.updateAccountToken(definition.provider, accountId, token);
        })
    };
});
