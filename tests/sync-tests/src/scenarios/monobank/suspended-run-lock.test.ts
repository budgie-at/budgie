import { Workload } from '@app/@generic/service/workload.service';
import { ExternalSourceEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberSet from 'effect/FiberSet';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';
import { vi } from 'vitest';

import {
    buildMonobank,
    fetchPersistedMonobankTransactions,
    inWorkload,
    MonobankSyncService,
    TestClockLayer,
    TestLayer
} from '../../harness';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';
import { testRuntime } from '../../harness/scenario/test-runtime';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const statementAccountParam = 'account';
const staleForwardSyncFromAt = new Date(Date.now() - 10 * 60 * 1000);
const nextTaskDelayMs = 0;

describe('monobank/suspended-run-lock', () => {
    it.effect('keeps a sync request made during the active account run', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const syncRepository = yield* SyncRepository;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const externalIds = ['mono-acc-1', 'mono-acc-2'];
            const requestedAccountIds: string[] = [];
            const blockerStarted = yield* Deferred.make<void>();
            const blockerGate = yield* Deferred.make<void>();
            const firstRequestStarted = yield* Deferred.make<void>();
            const firstRequestRelease = yield* Deferred.make<void>();
            const secondRequestFinished = yield* Deferred.make<void>();
            const secondClaimStarted = yield* Deferred.make<void>();
            const secondClaimRelease = yield* Deferred.make<void>();

            yield* seedMonobankForwardSyncAccounts(externalIds, staleForwardSyncFromAt);
            const [firstSyncRow, secondSyncRow] = yield* syncRepository.getByProvider(ExternalSourceEnum.MONOBANK);
            expect(firstSyncRow).toBeDefined();
            expect(secondSyncRow).toBeDefined();
            const originalSetStatus = syncRepository.setStatus;
            yield* Effect.acquireRelease(
                Effect.sync(() =>
                    vi
                        .spyOn(syncRepository, 'setStatus')
                        .mockImplementation((id, status) =>
                            originalSetStatus(id, status).pipe(
                                Effect.andThen(
                                    id === secondSyncRow.id && status === SyncStatusEnum.SYNCING
                                        ? Effect.andThen(
                                              Deferred.succeed(secondClaimStarted, undefined),
                                              Deferred.await(secondClaimRelease)
                                          )
                                        : Effect.void
                                )
                            )
                        )
                ),
                spy => Effect.sync(() => spy.mockRestore())
            );
            const blockerWork = yield* Effect.forkChild(
                inWorkload(Effect.andThen(Deferred.succeed(blockerStarted, undefined), Deferred.await(blockerGate)))
            );
            yield* Deferred.await(blockerStarted);
            const queuedWork = yield* Effect.forkChild(inWorkload(Effect.void));

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccountIds.push(String(params[statementAccountParam]));
                    if (requestedAccountIds.length === 1) {
                        runFork(Deferred.succeed(firstRequestStarted, undefined));

                        return testRuntime.runPromise(Effect.as(Deferred.await(firstRequestRelease), HttpResponse.json([])));
                    }

                    runFork(Deferred.succeed(secondRequestFinished, undefined));

                    return HttpResponse.json([]);
                })
            );

            const firstSync = yield* Effect.forkChild(monobankSyncService.sync());
            yield* Deferred.await(firstRequestStarted);
            const nestedSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Deferred.succeed(firstRequestRelease, undefined);
            yield* Fiber.join(firstSync);
            yield* Deferred.succeed(blockerGate, undefined);
            yield* Fiber.join(blockerWork);
            yield* Fiber.join(queuedWork);
            yield* Deferred.await(secondClaimStarted);
            const workBehindSecondSync = yield* Effect.forkChild(inWorkload(Effect.void));
            for (let attempt = 0; attempt < 100 && !(yield* workload.hasQueuedWork); attempt += 1) {
                yield* TestClock.withLive(Effect.sleep(10));
            }
            expect(yield* workload.hasQueuedWork).toBe(true);
            yield* Deferred.succeed(secondClaimRelease, undefined);
            yield* Fiber.join(nestedSync);
            yield* Fiber.join(workBehindSecondSync);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* TestClock.withLive(Effect.sleep(10));
            yield* Deferred.await(secondRequestFinished);
            expect(requestedAccountIds).toEqual(externalIds);
        }).pipe(Effect.scoped, Effect.provide(TestClockLayer))
    );

    it.effect('lets the suspended foreground request finish before queued background work starts', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const statementRequestGate = Promise.withResolvers<void>();
            const statementRequestStarted = Promise.withResolvers<void>();
            let requestedStatementCount = 0;

            yield* seedMonobankForwardSyncAccounts(['mono-acc-1'], staleForwardSyncFromAt);
            mockServer.use(
                http.get(statementEndpoint, () => {
                    requestedStatementCount += 1;
                    if (requestedStatementCount === 1) {
                        statementRequestStarted.resolve();

                        return statementRequestGate.promise.then(() =>
                            HttpResponse.json([buildMonobank.transaction({ id: 'stale-run-transaction', amount: -100, hold: false })])
                        );
                    }

                    return HttpResponse.json([]);
                })
            );

            const foregroundSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()).pipe(Effect.ignore));
            yield* Effect.promise(() => statementRequestStarted.promise);
            yield* workload.interruptBackground;
            const backgroundSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Effect.sleep(nextTaskDelayMs);
            const didReplacementRequestStartWhileForegroundWasSuspended = requestedStatementCount === 2;

            statementRequestGate.resolve();
            yield* Fiber.join(foregroundSync);
            yield* Fiber.join(backgroundSync);

            expect(didReplacementRequestStartWhileForegroundWasSuspended).toBe(false);
            expect(yield* fetchPersistedMonobankTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
