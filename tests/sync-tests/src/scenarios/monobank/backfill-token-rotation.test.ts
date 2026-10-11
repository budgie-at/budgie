import { Workload } from '@app/@generic/service/workload.service';
import { AccountRepository, AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { MONOBANK_RATE_LIMIT_MS } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import { isNotEmptyArray } from '@rnw-community/shared';

import {
    Clock,
    Fiber,
    inWorkload,
    MonobankSyncService,
    seed,
    setupBackwardSweepFixture,
    subtractMonths,
    TestClockLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

describe('monobank/backfill-token-rotation', () => {
    it.effect('uses the gated credential during rotation and shares the new credential quota across accounts', () =>
        Effect.gen(function* () {
            const [monobankSyncService, accountRepository, workload, clock] = yield* Effect.all([
                MonobankSyncService,
                AccountRepository,
                Workload,
                Effect.clockWith(Effect.succeed)
            ]);
            const batchLookupStarted = yield* Deferred.make<void>();
            const releaseBatchLookup = yield* Deferred.make<void>();
            const sweepStart = new Date();
            const sync = yield* setupBackwardSweepFixture(sweepStart, 4);
            yield* monobankSyncService.updateAccountToken(sync.accountId, 'quota-token-a');
            const secondAccount = yield* seed.account({ externalId: 'mono-shared-rotation', type: AccountTypeEnum.BANK_SYNC });
            yield* seed.sync({
                accountId: secondAccount.id,
                token: 'quota-token-a',
                mode: SyncModeEnum.BACKWARD,
                backwardSyncFromAt: sweepStart,
                backwardSyncLimitAt: subtractMonths(sweepStart, 4),
                forwardSyncedAt: sweepStart
            });
            const findById = accountRepository.findById;
            const requestedTokens: string[] = [];
            const requestedAccounts: string[] = [];
            const requestTimesByToken = new Map<string, number[]>();
            let lookupCount = 0;
            let rateLimitedRequests = 0;
            const accountLookup = vi.spyOn(accountRepository, 'findById').mockImplementation(accountId =>
                Effect.gen(function* () {
                    lookupCount += 1;
                    if (lookupCount === 3) {
                        yield* Deferred.succeed(batchLookupStarted, undefined);
                        yield* Deferred.await(releaseBatchLookup);
                    }
                    return yield* findById(accountId);
                })
            );
            mockServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', ({ request, params }) => {
                    const token = request.headers.get('X-Token') ?? '';
                    const previousTimes = requestTimesByToken.get(token) ?? [];
                    const requestedAtMs = clock.currentTimeMillisUnsafe();
                    requestedTokens.push(token);
                    requestedAccounts.push(String(params['account']));
                    requestTimesByToken.set(token, [...previousTimes, requestedAtMs]);
                    if (
                        isNotEmptyArray(previousTimes) &&
                        requestedAtMs - previousTimes[previousTimes.length - 1] < MONOBANK_RATE_LIMIT_MS
                    ) {
                        rateLimitedRequests += 1;
                        return new HttpResponse(null, { status: 429 });
                    }
                    return HttpResponse.json([]);
                })
            );
            yield* Effect.gen(function* () {
                const initialSyncRun = yield* Effect.forkChild(inWorkload(monobankSyncService.sync()));
                yield* Deferred.await(batchLookupStarted);
                yield* monobankSyncService.updateAccountToken(sync.accountId, 'quota-token-b');
                const nextSyncRun = yield* Effect.forkChild(
                    inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000))
                );
                yield* TestClock.withLive(Effect.sleep(10));
                expect(yield* workload.hasQueuedWork).toBe(true);
                yield* Deferred.succeed(releaseBatchLookup, undefined);
                yield* Fiber.join(initialSyncRun);
                yield* Fiber.join(nextSyncRun);
                expect(requestedTokens).toEqual(['quota-token-a', 'quota-token-b']);
                yield* inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000));
                expect(requestedTokens).toHaveLength(2);
                yield* workload.interruptBackground;
                yield* TestClock.adjust(MONOBANK_RATE_LIMIT_MS);
                yield* inWorkload(monobankSyncService.sync((yield* Clock.currentTimeMillis) + 25_000));
                expect(requestedTokens).toEqual(['quota-token-a', 'quota-token-b', 'quota-token-b']);
                expect(requestedAccounts).toEqual(['mono-acc-1', 'mono-shared-rotation', 'mono-acc-1']);
                expect(requestTimesByToken.get('quota-token-b')).toEqual([0, MONOBANK_RATE_LIMIT_MS]);
                expect(rateLimitedRequests).toBe(0);
            }).pipe(
                Effect.ensuring(Effect.sync(() => accountLookup.mockRestore())),
                Effect.ensuring(Deferred.succeed(releaseBatchLookup, undefined))
            );
        }).pipe(Effect.provide(TestClockLayer))
    );
});
