import { SyncModeEnum } from '@budgie/contracts';
import { MONOBANK_MAX_PERIOD_SECONDS, MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import { isDefined } from '@rnw-community/shared';

import {
    Fiber,
    MonobankSyncService,
    TestClockLayer,
    Workload,
    buildMonobank,
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    inWorkload,
    setupBackwardSweepFixture
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const backgroundWakeupBudgetMs = 130_000;

const waitForWindowSettled = Effect.fnUntraced(function* (
    syncId: number,
    expectedBackwardCursorMs: number,
    readCount: () => number,
    expectedCount: number
) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const sync = yield* fetchSyncById(syncId);
        if (readCount() >= expectedCount && sync.backwardSyncFromAt?.getTime() === expectedBackwardCursorMs) {
            yield* TestClock.withLive(Effect.sleep(10));

            return;
        }

        yield* TestClock.withLive(Effect.sleep(10));
    }
});

describe('monobank/background-continuation', () => {
    it.effect('completes three consecutive 31-day windows within a 130s background budget and stops before the fourth', () =>
        Effect.gen(function* () {
            const sweepStart = new Date('2026-06-01T00:00:00.000Z');
            const startMs = sweepStart.getTime();
            const windowMs = MONOBANK_MAX_PERIOD_SECONDS * 1000;
            const clock = yield* Effect.clockWith(Effect.succeed);
            const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => clock.currentTimeMillisUnsafe());
            yield* TestClock.setTime(startMs);

            return yield* Effect.gen(function* () {
                const monobankSyncService = yield* MonobankSyncService;
                const sync = yield* setupBackwardSweepFixture(sweepStart);
                const deadlineAtMs = Date.now() + backgroundWakeupBudgetMs;
                const requests: Array<{ readonly from: number; readonly to: number; readonly atMs: number }> = [];

                mockServer.use(
                    http.get(statementEndpoint, ({ params }) => {
                        const from = Number(params['from']);
                        const to = Number(params['to']);
                        const requestIndex = requests.length + 1;
                        requests.push({ from, to, atMs: clock.currentTimeMillisUnsafe() });

                        return HttpResponse.json([
                            buildMonobank.transaction({
                                id: `bg-window-${requestIndex}`,
                                amount: -100 * requestIndex,
                                description: `Window ${requestIndex}`,
                                hold: false,
                                time: from + 60
                            })
                        ]);
                    })
                );

                const syncRun = yield* monobankSyncService.sync(deadlineAtMs).pipe(inWorkload, Effect.forkChild);
                yield* waitForWindowSettled(sync.id, startMs - windowMs, () => requests.length, 1);
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* waitForWindowSettled(sync.id, startMs - 2 * windowMs, () => requests.length, 2);
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* waitForWindowSettled(sync.id, startMs - 3 * windowMs, () => requests.length, 3);

                const result = yield* Fiber.join(syncRun);
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* TestClock.withLive(Effect.sleep(10));

                expect(result).toBe(true);
                expect(requests).toHaveLength(3);
                expect(requests.map(request => request.atMs - startMs)).toEqual([0, 60_000, 120_000]);
                for (const request of requests) {
                    expect(request.atMs).toBeLessThanOrEqual(deadlineAtMs);
                    expect(request.to - request.from).toBe(MONOBANK_MAX_PERIOD_SECONDS);
                }

                const persistedTransactions = yield* fetchPersistedMonobankTransactions;
                expect(
                    persistedTransactions
                        .map(transaction => transaction.externalId)
                        .filter(isDefined)
                        .sort((first, second) => first.localeCompare(second))
                ).toEqual(['bg-window-1', 'bg-window-2', 'bg-window-3']);

                const finalSync = yield* fetchSyncById(sync.id);
                expect(finalSync.mode).toBe(SyncModeEnum.BACKWARD);
                expect(finalSync.backwardSyncFromAt?.getTime()).toBe(startMs - 3 * MONOBANK_MAX_PERIOD_SECONDS * 1000);
            }).pipe(Effect.ensuring(Effect.sync(() => void dateNowSpy.mockRestore())));
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('keeps fetching across 60s continuations until workload.interruptBackground stops it cleanly', () =>
        Effect.gen(function* () {
            const sweepStart = new Date('2026-06-01T00:00:00.000Z');
            const startMs = sweepStart.getTime();
            yield* TestClock.setTime(startMs);

            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const firstUserFinished = yield* Deferred.make<void>();
            const secondUserFinished = yield* Deferred.make<void>();
            const sync = yield* setupBackwardSweepFixture(sweepStart);
            let requestCount = 0;

            mockServer.use(
                http.get(statementEndpoint, () => {
                    requestCount += 1;
                    if (requestCount === 1) {
                        runFork(workload.runUser(Deferred.succeed(firstUserFinished, undefined)));
                    } else if (requestCount === 2) {
                        runFork(workload.runUser(Deferred.succeed(secondUserFinished, undefined)));
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(firstUserFinished);
            expect(requestCount).toBe(1);

            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* Deferred.await(secondUserFinished);
            expect(requestCount).toBe(2);

            yield* workload.interruptBackground;
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* TestClock.withLive(Effect.sleep(20));

            expect(requestCount).toBe(2);
            expect((yield* fetchSyncById(sync.id)).backwardSyncFromAt?.getTime()).toBe(startMs - 2 * MONOBANK_MAX_PERIOD_SECONDS * 1000);
        }).pipe(Effect.scoped, Effect.provide(TestClockLayer))
    );
});
