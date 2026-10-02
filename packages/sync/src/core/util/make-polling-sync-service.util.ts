import { AccountRepository, SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { subMonths } from 'date-fns/subMonths';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../constant/unknown-sync-error.constant';
import { SyncHistoryDepthEnum } from '../enum/sync-history-depth.enum';
import { SyncWorkload } from '../port/sync-workload.port';
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
    const transactionService = yield* TransactionService;
    const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
    const forwardSyncStaleThresholdMs = 2 * 60 * 1000;
    const syncErrorThreshold = 3;
    const backwardSyncLimitMonths: Record<SyncHistoryDepthEnum, number | null> = {
        [SyncHistoryDepthEnum.MONTH_1]: 1,
        [SyncHistoryDepthEnum.MONTHS_3]: 3,
        [SyncHistoryDepthEnum.MONTHS_6]: 6,
        [SyncHistoryDepthEnum.YEAR_1]: 12,
        [SyncHistoryDepthEnum.FULL]: null,
        [SyncHistoryDepthEnum.NEW_ONLY]: 0
    };
    const processedForwardSyncIds = new Set<number>();
    const applyProgressUpdate =
        definition.applyProgressUpdate ??
        ((sync: SyncEntityInterface, result: SyncBatchResultInterface) =>
            Effect.asVoid(syncRepository.update(sync.id, resolveSyncProgressUpdate(sync, result))));
    let runDeadlineAtMs = Number.POSITIVE_INFINITY;
    let failedSyncId: number | null = null;

    const shouldStopProcessing = (): boolean => definition.isRunDeferred?.() === true || Date.now() >= runDeadlineAtMs;

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
        const result = yield* definition.executeSyncBatch(pendingSync);
        yield* applyProgressUpdate(pendingSync, result);
        if (pendingSync.mode === SyncModeEnum.FORWARD && result.completed) {
            processedForwardSyncIds.add(pendingSync.id);
        }
        failedSyncId = null;
    });

    const shouldYieldAfterBatch = Effect.fnUntraced(function* () {
        if (yield* syncWorkload.hasQueuedWork) {
            return true;
        }

        return yield* Effect.raceFirst(
            Effect.as(Effect.sleep(definition.rateLimitMs), false),
            Effect.as(syncWorkload.awaitQueuedUserWork, true)
        );
    });

    const runSyncPass = Effect.fnUntraced(function* () {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs) || shouldStopProcessing()) {
            return true;
        }

        yield* (definition.beforeProcessRun ?? (() => Effect.void))(yield* resolveSyncToken(enabledSyncs[0]));
        if (shouldStopProcessing()) {
            return true;
        }

        const pendingSync = yield* getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return true;
        }

        yield* processPendingSync(pendingSync);

        const isRunFinished = definition.isRunWorkComplete?.() !== true && ((yield* shouldYieldAfterBatch()) || shouldStopProcessing());

        return isRunFinished ? true : null;
    });

    const retryAfterError = Effect.fnUntraced(function* (enabledSyncs: SyncEntityInterface[], errorMessage: string) {
        const syncToRetry = enabledSyncs.find(sync => sync.id === failedSyncId) ?? enabledSyncs[0];
        if (!isDefined(syncToRetry) || syncToRetry.errorCount >= syncErrorThreshold) {
            return false;
        }

        yield* syncRepository.recordError(syncToRetry.id, errorMessage);
        yield* Effect.sleep(definition.rateLimitMs);

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

    const sync = Effect.fn('AbstractPollingSyncService.sync')(function* (deadlineAtMs: number = Number.POSITIVE_INFINITY) {
        runDeadlineAtMs = deadlineAtMs;
        failedSyncId = null;
        processedForwardSyncIds.clear();

        return yield* Effect.ensuring(
            runSyncLoop(),
            Effect.sync(() => {
                definition.afterSyncRun?.();
            })
        );
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
        registerBackgroundTask: () => syncWorkload.registerBackgroundTask(definition.backgroundTaskName),
        updateAccountToken: Effect.fn('AbstractPollingSyncService.updateAccountToken')(function* (accountId: number, token: string) {
            yield* (definition.validateToken ?? (() => Effect.void))(token);
            yield* syncIntegrationTokenService.updateAccountToken(definition.provider, accountId, token);
        }),
        createOrUpdateSync: Effect.fnUntraced(function* (
            accountId: number,
            token: string,
            historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL,
            setupBalance: number | null = null
        ) {
            const { provider } = definition;
            const now = new Date();
            const months = backwardSyncLimitMonths[historyDepth];
            const backwardSyncLimitAt = isDefined(months) ? subMonths(now, months) : null;
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
        })
    };
});
