import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import * as TestClock from 'effect/testing/TestClock';
import { http, HttpResponse } from 'msw';

import { fetchSyncById, inWorkload, MonobankSyncService, setupTransientFailureFixture, TestClockLayer, Workload } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testRuntime } from '../../harness/scenario/test-runtime';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

for (const mode of [SyncModeEnum.FORWARD, SyncModeEnum.BACKWARD]) {
    it.effect(
        `serves a ready independent ${mode} credential after exhausted failure yields to queued work`,
        () =>
            Effect.gen(function* () {
                const service = yield* MonobankSyncService;
                const workload = yield* Workload;
                const runFork = yield* FiberSet.makeRuntime<Workload>();
                const userStarted = yield* Deferred.make<void>();
                const releaseUser = yield* Deferred.make<void>();
                const userFinished = yield* Deferred.make<void>();
                const healthyRequested = yield* Deferred.make<void>();
                const { cursor, failed, good, pausedSync, sharedSync } = yield* setupTransientFailureFixture(mode);
                const events: string[] = [];
                let failedRequests = 0;
                mockServer.use(
                    http.get(statementEndpoint, ({ params }) =>
                        testRuntime.runPromise(
                            Effect.gen(function* () {
                                events.push(String(params['account']));
                                if (params['account'] === 'mono-broken') {
                                    failedRequests += 1;
                                    if (failedRequests === 4) {
                                        runFork(
                                            workload
                                                .runUser(
                                                    Effect.gen(function* () {
                                                        events.push('user');
                                                        yield* Deferred.succeed(userStarted, undefined);
                                                        yield* Deferred.await(releaseUser);
                                                    })
                                                )
                                                .pipe(Deferred.into(userFinished))
                                        );
                                        yield* TestClock.withLive(workload.awaitQueuedUserWork.pipe(Effect.timeout(1_000)));
                                    }

                                    return new HttpResponse(null, { status: 503 });
                                }

                                yield* Deferred.succeed(healthyRequested, undefined);

                                return HttpResponse.json([]);
                            })
                        )
                    )
                );

                expect(yield* inWorkload(service.sync())).toBe(false);
                yield* Deferred.await(userStarted);
                expect(failedRequests).toBe(4);
                expect(events).not.toContain('mono-healthy');
                yield* Deferred.succeed(releaseUser, undefined);
                yield* Deferred.await(userFinished);
                yield* TestClock.withLive(Effect.sleep(200));
                expect(yield* Deferred.isDone(healthyRequested)).toBe(true);
                expect(events.indexOf('user')).toBeLessThan(events.indexOf('mono-healthy'));
                expect(failedRequests).toBe(4);
                const goodAfter = yield* fetchSyncById(good.id);
                expect(goodAfter).toMatchObject({ status: SyncStatusEnum.IDLE, mode: SyncModeEnum.FORWARD });
                if (mode === SyncModeEnum.BACKWARD) {
                    expect(goodAfter.backwardSyncFromAt?.getTime()).toBeLessThan(cursor.getTime());
                } else {
                    expect(goodAfter.forwardSyncFromAt?.getTime()).toBeGreaterThan(cursor.getTime());
                }
                const failedAfter = yield* fetchSyncById(failed.id);
                expect({ ...failedAfter, lastError: failed.lastError }).toEqual(failed);
                expect(failedAfter.lastError).not.toBeNull();
                expect(yield* fetchSyncById(pausedSync.id)).toEqual(pausedSync);
                expect(events).not.toContain('mono-paused');
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS - 1);
                yield* TestClock.withLive(Effect.sleep(20));
                expect(failedRequests).toBe(4);
                expect(events).not.toContain('mono-shared');
                expect(yield* fetchSyncById(sharedSync.id)).toEqual(sharedSync);
            }).pipe(Effect.provide(TestClockLayer)),
        20_000
    );
}
