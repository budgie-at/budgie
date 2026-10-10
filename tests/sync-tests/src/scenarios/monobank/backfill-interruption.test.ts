import { Workload } from '@app/@generic/service/workload.service';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import { Clock, Fiber, fetchSyncById, inWorkload, MonobankSyncService, setupBackwardSweepFixture, TestClockLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testRuntime } from '../../harness/scenario/test-runtime';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

describe('monobank/backfill-interruption', () => {
    it.effect('aborts an active continuation request and safely resumes its saved window', () =>
        Effect.gen(function* () {
            const [monobankSyncService, workload, runFork] = yield* Effect.all([
                MonobankSyncService,
                Workload,
                FiberSet.makeRuntime<Workload>()
            ]);
            const firstUserFinished = yield* Deferred.make<void>();
            const blockedRequestStarted = yield* Deferred.make<void>();
            const resumedRequestStarted = yield* Deferred.make<void>();
            const releaseRequests = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 4);
            const clock = yield* Effect.clockWith(Effect.succeed);
            const requests: Array<{ readonly at: number; readonly signal: AbortSignal; readonly from: number }> = [];
            const inFlightRequests = new Set<AbortSignal>();
            let maximumInFlightRequests = 0;

            mockServer.use(
                http.get(statementEndpoint, ({ request, params }) =>
                    testRuntime.runPromise(
                        Effect.gen(function* () {
                            requests.push({ at: clock.currentTimeMillisUnsafe(), signal: request.signal, from: Number(params['from']) });
                            inFlightRequests.add(request.signal);
                            request.signal.addEventListener('abort', () => inFlightRequests.delete(request.signal), { once: true });
                            maximumInFlightRequests = Math.max(maximumInFlightRequests, inFlightRequests.size);
                            if (requests.length === 1) {
                                runFork(workload.runUser(Deferred.succeed(firstUserFinished, undefined)));
                                return HttpResponse.json([]);
                            }

                            yield* Deferred.succeed(blockedRequestStarted, undefined);
                            if (requests.length === 3) {
                                yield* Deferred.succeed(resumedRequestStarted, undefined);
                            }
                            yield* Deferred.await(releaseRequests);
                            return HttpResponse.json([]);
                        }).pipe(Effect.ensuring(Effect.sync(() => inFlightRequests.delete(request.signal))))
                    )
                )
            );

            yield* Effect.gen(function* () {
                yield* inWorkload(monobankSyncService.sync());
                yield* Deferred.await(firstUserFinished);
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* Deferred.await(blockedRequestStarted);
                const savedSync = yield* fetchSyncById(sync.id);
                yield* workload.interruptBackground;
                expect(requests[1].signal.aborted).toBe(true);
                expect((yield* fetchSyncById(sync.id)).backwardSyncFromAt).toEqual(savedSync.backwardSyncFromAt);
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                const resumedSyncRun = yield* Effect.forkChild(
                    inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000))
                );
                yield* Deferred.await(resumedRequestStarted);
                expect(requests).toHaveLength(3);
                expect(requests[2].from).toBe(requests[1].from);
                expect(requests[2].at - requests[1].at).toBeGreaterThanOrEqual(MONOBANK_RATE_LIMIT_MS);
                expect(maximumInFlightRequests).toBe(1);
                yield* Deferred.succeed(releaseRequests, undefined);
                yield* Fiber.join(resumedSyncRun);
                expect((yield* fetchSyncById(sync.id)).backwardSyncFromAt?.getTime()).toBeLessThan(
                    savedSync.backwardSyncFromAt?.getTime() ?? Number.POSITIVE_INFINITY
                );
            }).pipe(Effect.ensuring(Deferred.succeed(releaseRequests, undefined)));
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('rejects a late continuation after background interruption and resumes on a fresh run', () =>
        Effect.gen(function* () {
            const [monobankSyncService, workload, runFork] = yield* Effect.all([
                MonobankSyncService,
                Workload,
                FiberSet.makeRuntime<Workload>()
            ]);
            const requestStarted = yield* Deferred.make<void>();
            const releaseRequest = yield* Deferred.make<void>();
            const userFinished = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 4);
            let requests = 0;

            mockServer.use(
                http.get(statementEndpoint, () =>
                    testRuntime.runPromise(
                        Effect.gen(function* () {
                            requests += 1;
                            if (requests === 1) {
                                yield* Deferred.succeed(requestStarted, undefined);
                                yield* Deferred.await(releaseRequest);
                            }
                            return HttpResponse.json([]);
                        })
                    )
                )
            );

            const initialSyncRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Deferred.await(requestStarted);
            runFork(workload.runUser(Deferred.succeed(userFinished, undefined)));
            yield* TestClock.withLive(Effect.sleep(10));
            expect(yield* workload.hasQueuedUserWork).toBe(true);
            yield* workload.interruptBackground;
            yield* Deferred.succeed(releaseRequest, undefined);
            yield* Fiber.join(initialSyncRun);
            yield* Deferred.await(userFinished);
            const savedSync = yield* fetchSyncById(sync.id);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* TestClock.withLive(Effect.sleep(20));
            expect(requests).toBe(1);
            const resumedSyncRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000)));
            yield* Fiber.join(resumedSyncRun);
            expect(requests).toBe(2);
            expect((yield* fetchSyncById(sync.id)).backwardSyncFromAt?.getTime()).toBeLessThan(
                savedSync.backwardSyncFromAt?.getTime() ?? Number.POSITIVE_INFINITY
            );
        }).pipe(Effect.provide(TestClockLayer))
    );
});
