import { Workload } from '@app/@generic/service/workload.service';
import { AppDataSyncService } from '@app/sync/service/app-data-sync.service';
import {
    AccountRepository,
    AccountTypeEnum,
    RuleActionTypeEnum,
    SyncEntityTable,
    SyncModeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Clock from 'effect/Clock';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberSet from 'effect/FiberSet';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import {
    buildMonobank,
    fetchPersistedMonobankTransactions,
    fetchSyncById,
    inWorkload,
    MonobankSyncService,
    seed,
    setupBackwardSweepFixture,
    subtractMonths,
    testDb,
    TestClockLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testRuntime } from '../../harness/scenario/test-runtime';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

const statementEndpoint = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

const synchronizeTestClock = Effect.gen(function* () {
    const clock = yield* Effect.clockWith(Effect.succeed);

    yield* Effect.acquireRelease(
        Effect.sync(() => vi.spyOn(Date, 'now').mockImplementation(() => clock.currentTimeMillisUnsafe())),
        spy => Effect.sync(() => spy.mockRestore())
    );
});

const advanceWindows = Effect.fnUntraced(function* (count: number) {
    for (let window = 0; window < count; window += 1) {
        yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
        yield* TestClock.withLive(Effect.sleep(10));
    }
});

describe('monobank/backfill-continuation', () => {
    it.effect('finishes at least four backward windows after queued user work from one start', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const importFinished = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 5);
            let requestCount = 0;

            mockServer.use(
                http.get(statementEndpoint, () => {
                    requestCount += 1;
                    if (requestCount === 1) {
                        runFork(workload.runUser(Deferred.succeed(importFinished, undefined)));
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(importFinished);
            yield* advanceWindows(6);

            expect(requestCount).toBeGreaterThanOrEqual(4);
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('resumes a backward window when user work arrives during cooldown', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 2);
            const firstRequestFinished = yield* Deferred.make<void>();
            const userWorkFinished = yield* Deferred.make<void>();
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            let requestCount = 0;

            mockServer.use(
                http.get(statementEndpoint, () => {
                    requestCount += 1;
                    if (requestCount === 1) {
                        runFork(Deferred.succeed(firstRequestFinished, undefined));
                    }

                    return HttpResponse.json([]);
                })
            );

            const startupSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Deferred.await(firstRequestFinished);
            yield* TestClock.withLive(Effect.sleep(10));
            const userWork = yield* Effect.forkChild(workload.runUser(Deferred.succeed(userWorkFinished, undefined)));
            yield* Deferred.await(userWorkFinished);
            yield* Fiber.join(startupSync);
            yield* Fiber.join(userWork);
            yield* advanceWindows(3);

            expect(requestCount).toBeGreaterThanOrEqual(2);
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('retries a queued 429 window without incrementing the sync error count', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const userWorkFinished = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 1);
            let requestCount = 0;
            const requestedWindows: string[] = [];

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestCount += 1;
                    requestedWindows.push(`${String(params['from'])}:${String(params['to'])}`);
                    if (requestCount === 1) {
                        runFork(workload.runUser(Deferred.succeed(userWorkFinished, undefined)));

                        return new HttpResponse(null, { status: 429 });
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(userWorkFinished);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* TestClock.withLive(Effect.sleep(10));

            expect(requestCount).toBe(2);
            expect(requestedWindows[1]).toBe(requestedWindows[0]);
            expect((yield* fetchSyncById(sync.id)).errorCount).toBe(0);
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('spaces two accounts with one token by a full minute across a yield', () =>
        Effect.gen(function* () {
            const sweepStart = new Date();
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const firstRequestStarted = yield* Deferred.make<void>();
            const firstRequestRelease = yield* Deferred.make<void>();
            const secondRequestStarted = yield* Deferred.make<void>();
            const accountIds = ['mono-a', 'mono-b'];
            const syncIds: number[] = [];
            const requestedAccounts: string[] = [];
            const requestedTokens: string[] = [];
            const requestedAtMs: number[] = [];

            for (const externalId of accountIds) {
                const account = yield* seed.account({ externalId });
                const sync = yield* seed.sync({
                    accountId: account.id,
                    mode: SyncModeEnum.BACKWARD,
                    backwardSyncFromAt: sweepStart,
                    backwardSyncLimitAt: subtractMonths(sweepStart, 1),
                    forwardSyncedAt: sweepStart
                });
                syncIds.push(sync.id);
            }

            mockServer.use(
                http.get(statementEndpoint, ({ params, request }) =>
                    testRuntime.runPromise(
                        Effect.gen(function* () {
                            requestedAccounts.push(String(params['account']));
                            requestedTokens.push(request.headers.get('X-Token') ?? '');
                            requestedAtMs.push(yield* Clock.currentTimeMillis);
                            if (requestedAccounts.length === 1) {
                                yield* Deferred.succeed(firstRequestStarted, undefined);
                                yield* Deferred.await(firstRequestRelease);
                            } else {
                                yield* Deferred.succeed(secondRequestStarted, undefined);
                            }

                            return HttpResponse.json([]);
                        })
                    )
                )
            );

            const firstSync = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* Deferred.await(firstRequestStarted);
            const secondSync = yield* Effect.forkChild(monobankSyncService.sync());
            const userWork = yield* Effect.forkChild(workload.runUser(Effect.void));
            for (let attempt = 0; attempt < 100 && !(yield* workload.hasQueuedUserWork); attempt += 1) {
                yield* TestClock.withLive(Effect.sleep(10));
            }
            expect(yield* workload.hasQueuedUserWork).toBe(true);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            expect(requestedAccounts).toHaveLength(1);
            yield* Deferred.succeed(firstRequestRelease, undefined);
            yield* Fiber.join(firstSync);
            yield* Fiber.join(userWork);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS - 1);
            yield* TestClock.withLive(Effect.sleep(10));
            expect(requestedAccounts).toHaveLength(1);

            yield* TestClock.adjust(1);
            yield* Deferred.await(secondRequestStarted);
            yield* Fiber.join(secondSync);
            yield* TestClock.withLive(Effect.sleep(10));
            expect(requestedAccounts).toEqual(accountIds);
            expect(new Set(requestedTokens).size).toBe(1);
            expect(requestedAtMs[1] - requestedAtMs[0]).toBeGreaterThanOrEqual(MONOBANK_RATE_LIMIT_MS);
            for (const syncId of syncIds) {
                expect((yield* fetchSyncById(syncId)).mode).toBe(SyncModeEnum.FORWARD);
            }
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('waits a full minute after a delayed first API request', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const accountRepository = yield* AccountRepository;
            const workload = yield* Workload;
            const clock = yield* Effect.clockWith(Effect.succeed);
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const firstLookupStarted = yield* Deferred.make<void>();
            const userWorkFinished = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart);
            const findByIdBeforeDelay = accountRepository.findById;
            const requestTimes: number[] = [];
            let shouldDelayFirstLookup = true;

            yield* testDb
                .update(SyncEntityTable)
                .set({ backwardSyncLimitAt: subtractMonths(sweepStart, 2) })
                .where(eq(SyncEntityTable.id, sync.id));

            const accountLookupSpy = vi.spyOn(accountRepository, 'findById').mockImplementation(accountId =>
                Effect.gen(function* () {
                    if (shouldDelayFirstLookup) {
                        shouldDelayFirstLookup = false;
                        yield* Deferred.succeed(firstLookupStarted, undefined);
                        yield* Effect.sleep(10_000);
                    }

                    return yield* findByIdBeforeDelay(accountId);
                })
            );
            yield* Effect.gen(function* () {
                mockServer.use(
                    http.get(statementEndpoint, () => {
                        requestTimes.push(clock.currentTimeMillisUnsafe());
                        if (requestTimes.length === 1) {
                            runFork(workload.runUser(Deferred.succeed(userWorkFinished, undefined)));
                        }

                        return HttpResponse.json([]);
                    })
                );

                const initialRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
                yield* Deferred.await(firstLookupStarted);
                yield* TestClock.adjust(10_000);
                yield* Deferred.await(userWorkFinished);
                yield* Fiber.join(initialRun);
                expect(requestTimes).toHaveLength(1);

                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS - 1);
                yield* TestClock.withLive(Effect.sleep(10));
                expect(requestTimes).toHaveLength(1);

                yield* TestClock.adjust(1);
                yield* TestClock.withLive(Effect.sleep(10));
                expect(requestTimes).toHaveLength(2);
                expect(requestTimes[1] - requestTimes[0]).toBeGreaterThanOrEqual(MONOBANK_RATE_LIMIT_MS);
            }).pipe(Effect.ensuring(Effect.sync(() => accountLookupSpy.mockRestore())));
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('preserves the token cooldown across 25-second deadline attempts and resumes the saved cursor', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 4);
            const requestedFrom: number[] = [];

            yield* synchronizeTestClock;

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestedFrom.push(Number(params['from']));

                    return HttpResponse.json([]);
                })
            );

            for (const elapsedMs of [0, 10_000]) {
                yield* TestClock.adjust(elapsedMs);
                yield* inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000));
                expect(requestedFrom).toHaveLength(1);
                expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.BACKWARD);
            }

            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS - 10_000);
            yield* TestClock.withLive(Effect.sleep(10));
            expect(requestedFrom).toHaveLength(1);

            const nextRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            yield* advanceWindows(5);
            yield* Fiber.join(nextRun);

            expect(requestedFrom.length).toBeGreaterThanOrEqual(4);
            expect(requestedFrom[1]).toBeLessThan(requestedFrom[0]);
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
        }).pipe(Effect.scoped, Effect.provide(TestClockLayer))
    );

    it.effect('lets later queued user work run before a due continuation request', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const runFork = yield* FiberSet.makeRuntime<Workload>();
            const firstUserFinished = yield* Deferred.make<void>();
            const secondRequest = yield* Deferred.make<void>();
            const holderStarted = yield* Deferred.make<void>();
            const releaseHolder = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 2);
            const events: string[] = [];

            mockServer.use(
                http.get(statementEndpoint, () => {
                    events.push('request');
                    if (events.length === 1) {
                        runFork(workload.runUser(Deferred.succeed(firstUserFinished, undefined)));
                    } else {
                        runFork(Deferred.succeed(secondRequest, undefined));
                    }

                    return HttpResponse.json([]);
                })
            );

            yield* inWorkload(monobankSyncService.sync());
            yield* Deferred.await(firstUserFinished);
            const holder = yield* Effect.forkChild(
                workload.run(Effect.andThen(Deferred.succeed(holderStarted, undefined), Deferred.await(releaseHolder)))
            );
            yield* Deferred.await(holderStarted);
            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* TestClock.withLive(Effect.sleep(10));
            expect(yield* workload.hasQueuedWork).toBe(true);

            const laterUserWork = yield* Effect.forkChild(
                workload.runUser(
                    Effect.sync(() => {
                        events.push('user');
                    })
                )
            );
            yield* TestClock.withLive(Effect.sleep(10));
            yield* Deferred.succeed(releaseHolder, undefined);
            yield* Fiber.join(holder);
            yield* Fiber.join(laterUserWork);
            yield* Deferred.await(secondRequest);
            yield* TestClock.withLive(Effect.sleep(10));

            expect(events).toEqual(['request', 'user', 'request']);
            for (let window = 0; window < 2; window += 1) {
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* TestClock.withLive(Effect.sleep(10));
            }
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
        }).pipe(Effect.provide(TestClockLayer))
    );
    it.effect('finishes backfill after a real rule conversion drainer queues during cooldown', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const workload = yield* Workload;
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 4);
            const transferAccount = yield* seed.account({ type: AccountTypeEnum.CASH });
            let requestCount = 0;

            yield* seedTitleRule('SPAR', {
                type: RuleActionTypeEnum.CONVERT_TO_TRANSFER,
                categoryId: null,
                accountId: transferAccount.id
            });

            mockServer.use(
                http.get(statementEndpoint, ({ params }) => {
                    requestCount += 1;

                    return HttpResponse.json(
                        requestCount === 1
                            ? [
                                  buildMonobank.transaction({
                                      id: 'real-rule-first',
                                      amount: -100,
                                      description: 'SPAR MARKET',
                                      hold: false,
                                      time: Number(params['from']) + 10
                                  })
                              ]
                            : []
                    );
                })
            );

            const initialRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
            for (let attempt = 0; attempt < 100 && requestCount === 0; attempt += 1) {
                yield* TestClock.withLive(Effect.sleep(10));
            }
            expect(requestCount).toBe(1);
            for (let attempt = 0; attempt < 20 && !(yield* workload.hasQueuedWork); attempt += 1) {
                yield* TestClock.adjust(250);
                yield* TestClock.withLive(Effect.sleep(10));
            }
            expect(yield* workload.hasQueuedWork).toBe(true);

            yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
            yield* Fiber.join(initialRun);
            yield* advanceWindows(6);

            expect(requestCount).toBeGreaterThanOrEqual(4);
            expect((yield* fetchSyncById(sync.id)).mode).toBe(SyncModeEnum.FORWARD);
            expect(
                (yield* fetchPersistedMonobankTransactions()).find(transaction => transaction.externalId === 'real-rule-first')?.type
            ).toBe(TransactionTypeEnum.TRANSFER);
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('finishes queued startup across a shared-token quota without a 429', () =>
        Effect.gen(function* () {
            const appDataSyncService = yield* AppDataSyncService;
            const workload = yield* Workload;
            const clock = yield* Effect.clockWith(Effect.succeed);
            const runFork = yield* FiberSet.makeRuntime<never>();
            const start = new Date();
            const syncIds: number[] = [];
            const queuedRuns: Fiber.Fiber<boolean, never>[] = [];
            const lastRequestAtByToken = new Map<string, number>();
            let rateLimitedRequests = 0;

            yield* TestClock.setTime(start.getTime());
            yield* synchronizeTestClock;
            for (const externalId of ['mono-startup-a', 'mono-startup-b']) {
                const account = yield* seed.account({ externalId });
                const sync = yield* seed.sync({
                    accountId: account.id,
                    token: 'startup-shared-token',
                    mode: SyncModeEnum.BACKWARD,
                    backwardSyncFromAt: start,
                    backwardSyncLimitAt: subtractMonths(start, 4),
                    forwardSyncedAt: start
                });
                syncIds.push(sync.id);
            }

            mockServer.use(
                http.get(statementEndpoint, ({ request }) => {
                    const token = request.headers.get('X-Token') ?? '';
                    const nowMs = clock.currentTimeMillisUnsafe();
                    const previousRequestAtMs = lastRequestAtByToken.get(token);
                    if (queuedRuns.length === 0) {
                        queuedRuns.push(runFork(workload.run(appDataSyncService.sync())));
                    }

                    if (previousRequestAtMs !== undefined && nowMs - previousRequestAtMs < MONOBANK_RATE_LIMIT_MS) {
                        rateLimitedRequests += 1;
                        lastRequestAtByToken.set(token, nowMs);

                        return new HttpResponse(null, { status: 429 });
                    }

                    lastRequestAtByToken.set(token, nowMs);

                    return HttpResponse.json([]);
                }),
                http.get('https://api.monobank.ua/bank/currency', () => HttpResponse.json([])),
                http.get('https://api.exchangerate-api.com/v4/latest/USD', () =>
                    HttpResponse.json({ base: 'USD', date: '2026-10-09', rates: { USD: 1, UAH: 41, EUR: 0.9 } })
                ),
                http.get('https://api.coingecko.com/api/v3/simple/price', () => HttpResponse.json({}))
            );

            const startup = yield* Effect.forkChild(workload.run(appDataSyncService.sync()));
            yield* TestClock.withLive(Effect.sleep(20));
            for (let window = 0; window < 12; window += 1) {
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* TestClock.withLive(Effect.sleep(10));
            }
            yield* Fiber.join(startup);
            for (const queuedRun of queuedRuns) {
                yield* Fiber.join(queuedRun);
            }

            expect(rateLimitedRequests).toBe(0);
            for (const syncId of syncIds) {
                expect((yield* fetchSyncById(syncId)).mode).toBe(SyncModeEnum.FORWARD);
            }
        }).pipe(Effect.scoped, Effect.provide(TestClockLayer))
    );
});
