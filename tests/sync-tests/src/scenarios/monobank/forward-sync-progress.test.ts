import { MonobankSyncService } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberSet from 'effect/FiberSet';
import * as Queue from 'effect/Queue';
import * as Schedule from 'effect/Schedule';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import { isDefined } from '@rnw-community/shared';

import { fetchPersistedMonobankTransactions, fetchSyncById, inWorkload, Workload } from '../../harness';
import { TEST_SCENARIO_TIME } from '../../harness/constant/test-scenario-time.constant';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { mockServer } from '../../harness/scenario/mock-server';
import { createScenarioClockLayer } from '../../harness/utils/create-scenario-clock-layer.util';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';
const MS_PER_SECOND = 1_000;
const RESPONSE_DELAY_MS = 1_100;
const FORWARD_GAP_MS = 24 * 60 * 60 * MS_PER_SECOND;
const forwardSyncFromAt = new Date(TEST_SCENARIO_TIME - FORWARD_GAP_MS);
const accountExternalIds = ['mono-acc-1', 'mono-acc-2', 'mono-acc-3'];

const TestLayer = createScenarioClockLayer(TEST_SCENARIO_TIME);

const withAutoAdvanceClock = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.gen(function* () {
        const clock = yield* TestClock.testClockWith(Effect.succeed);
        const sleep = clock.sleep.bind(clock);
        const requestedSleeps = yield* Queue.unbounded<Duration.Duration>();
        yield* Effect.acquireRelease(
            Effect.sync(() =>
                vi
                    .spyOn(clock, 'sleep')
                    .mockImplementation(duration => Effect.andThen(Queue.offer(requestedSleeps, duration), sleep(duration)))
            ),
            spy => Effect.sync(() => void spy.mockRestore())
        );
        yield* Queue.take(requestedSleeps).pipe(
            Effect.flatMap(duration => duration.pipe(Duration.toMillis, TestClock.adjust)),
            Effect.forever,
            Effect.forkChild
        );

        return yield* effect;
    });

describe('monobank/forward-sync-progress', () => {
    it.effect('moves the forward cursor to the fetched upper bound, not to the time the batch finished', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const [syncId] = yield* seedMonobankForwardSyncAccounts(['mono-acc-cursor'], forwardSyncFromAt);
            const requestedUpperBounds: number[] = [];
            const responseRequested = yield* Deferred.make<void>();
            const releaseResponse = yield* Deferred.make<void>();
            const runResponse = Effect.runPromiseWith(yield* Effect.context());
            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedUpperBounds.push(Number(params['to']));

                    return runResponse(
                        Deferred.succeed(responseRequested, undefined).pipe(
                            Effect.andThen(Deferred.await(releaseResponse)),
                            Effect.as(HttpResponse.json([]))
                        )
                    );
                })
            );

            const syncFiber = yield* Effect.forkChild(monobankSyncService.sync());
            yield* Deferred.await(responseRequested);
            yield* TestClock.adjust(RESPONSE_DELAY_MS);
            yield* Deferred.succeed(releaseResponse, undefined);
            yield* Fiber.join(syncFiber);

            expect(requestedUpperBounds).toHaveLength(1);
            expect((yield* fetchSyncById(syncId)).forwardSyncFromAt?.getTime()).toBe(requestedUpperBounds[0] * MS_PER_SECOND);
        }).pipe(withAutoAdvanceClock, Effect.provide(TestLayer))
    );

    it.effect('keeps the forward cursor when the statement response is invalid', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const [syncId] = yield* seedMonobankForwardSyncAccounts(['mono-acc-invalid'], forwardSyncFromAt);
            const syncBefore = yield* fetchSyncById(syncId);
            mockServer.use(http.get(statementEndpoint, () => HttpResponse.json([{ unexpected: true }])));

            yield* monobankSyncService.sync();

            const syncAfter = yield* fetchSyncById(syncId);
            expect(syncAfter.forwardSyncFromAt).toEqual(syncBefore.forwardSyncFromAt);
            expect(syncAfter.lastError).not.toBeNull();
            expect(yield* fetchPersistedMonobankTransactions).toHaveLength(0);
        }).pipe(withAutoAdvanceClock, Effect.provide(TestLayer))
    );

    it.effect('continues every stale forward account after queued user work stops the first run', () =>
        Effect.gen(function* () {
            const workload = yield* Workload;
            const userWorkDone = yield* Deferred.make<void>();
            const queueUserWork = yield* FiberSet.makeRuntime<Workload>();
            const requestedAccounts = new Set<string>();
            const syncIds = yield* seedMonobankForwardSyncAccounts(accountExternalIds, forwardSyncFromAt);
            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedAccounts.add(String(params['account']));
                    if (requestedAccounts.size === 1) {
                        queueUserWork(workload.runUser(Deferred.succeed(userWorkDone, undefined)));
                    }

                    return HttpResponse.json([]);
                })
            );

            const monobankSyncService = yield* MonobankSyncService;

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(userWorkDone);
            yield* Effect.forEach(syncIds, syncId =>
                fetchSyncById(syncId).pipe(
                    Effect.repeat({ until: sync => isDefined(sync.forwardSyncedAt), schedule: Schedule.spaced(RESPONSE_DELAY_MS) })
                )
            );

            expect([...requestedAccounts].sort()).toEqual(accountExternalIds);
        }).pipe(withAutoAdvanceClock, Effect.provide(TestLayer))
    );
});
