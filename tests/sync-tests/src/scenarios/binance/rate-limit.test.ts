import { BinanceHistorySourceEnum, BinanceSignedClient, BinanceWeightThrottle } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Headers from 'effect/http/Headers';
import * as TestClock from 'effect/testing/TestClock';
import { HttpResponse, http } from 'msw';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    DEPOSIT_URL,
    buildBinance,
    stubBinanceServerTime,
    stubEmptyBinanceSources,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

describe('binance/rate-limit', () => {
    it.effect('returns a dedicated deferred error when the signed request deadline has expired', () =>
        Effect.gen(function* () {
            stubBinanceServerTime();

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN, Date.now() - 1);
            const error = yield* Effect.flip(
                client.getTransactions(BinanceHistorySourceEnum.CAPITAL, BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO)
            );

            expect(error._tag).toBe('SyncDeferredError');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a 429 deposit response to a rate-limited error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 429 })));

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const error = yield* Effect.flip(
                client.getTransactions(BinanceHistorySourceEnum.CAPITAL, BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO)
            );

            expect(error._tag).toBe('SyncRateLimitedError');
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('binance/weight-throttle', () => {
    const FIAT_PATH = '/sapi/v1/fiat/orders?timestamp=1&signature=x';
    const C2C_PATH = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';
    const MY_TRADES_PATH = '/api/v3/myTrades';
    const MINUTE_MS = 60_000;

    const callTimes = (throttle: BinanceWeightThrottle, endpoint: string, count: number) =>
        Effect.forEach(Array.from({ length: count }), () => throttle.waitIfNeeded(endpoint).pipe(Effect.andThen(Clock.currentTimeMillis)), {
            concurrency: 1
        });

    it.effect('lets 4 fiat calls through and holds the 5th until the minute resets', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(Number.MAX_SAFE_INTEGER);

            expect(yield* callTimes(throttle, FIAT_PATH, 4)).toEqual([0, 0, 0, 0]);

            const fifth = yield* Effect.forkChild(throttle.waitIfNeeded(FIAT_PATH));
            yield* TestClock.adjust(MINUTE_MS - 1);
            expect(fifth.pollUnsafe()).toBeUndefined();

            yield* TestClock.adjust(1);
            yield* Fiber.join(fifth);
        })
    );

    it.effect('does not pause a cheap SAPI call after heavy fiat usage', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(Number.MAX_SAFE_INTEGER);

            yield* callTimes(throttle, FIAT_PATH, 4);

            expect(yield* callTimes(throttle, C2C_PATH, 50)).toEqual(Array.from({ length: 50 }, () => 0));
        })
    );

    it.effect('pauses the spot pool only once 6000 weight would be exceeded', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(Number.MAX_SAFE_INTEGER);

            yield* callTimes(throttle, MY_TRADES_PATH, 300);

            const next = yield* Effect.forkChild(throttle.waitIfNeeded(MY_TRADES_PATH));
            yield* TestClock.adjust(MINUTE_MS - 1);
            expect(next.pollUnsafe()).toBeUndefined();

            yield* TestClock.adjust(1);
            yield* Fiber.join(next);
        })
    );

    it.effect('seeds the budget from response headers', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(Number.MAX_SAFE_INTEGER);

            yield* throttle.waitIfNeeded(FIAT_PATH);
            throttle.recordHeaders(FIAT_PATH, Headers.fromInput({ 'x-sapi-used-uid-weight-1m': '170000' }));

            const next = yield* Effect.forkChild(throttle.waitIfNeeded(FIAT_PATH));
            yield* TestClock.adjust(MINUTE_MS);
            yield* Fiber.join(next);
            expect(yield* Clock.currentTimeMillis).toBe(MINUTE_MS);
        })
    );

    it.effect('defers the run when the pause would cross the deadline', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(30_000);

            yield* callTimes(throttle, FIAT_PATH, 4);

            const error = yield* Effect.flip(throttle.waitIfNeeded(FIAT_PATH));

            expect(error._tag).toBe('SyncDeferredError');
        })
    );

    it.effect('honours a Retry-After cool-down', () =>
        Effect.gen(function* () {
            const throttle = new BinanceWeightThrottle(Number.MAX_SAFE_INTEGER);

            yield* throttle.coolDownFor(5000);

            const next = yield* Effect.forkChild(throttle.waitIfNeeded(C2C_PATH));
            yield* TestClock.adjust(4999);
            expect(next.pollUnsafe()).toBeUndefined();

            yield* TestClock.adjust(1);
            yield* Fiber.join(next);
        })
    );
});

describe('binance/per-run-cache', () => {
    it.effect('serves a repeated window from the cache without re-fetching', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(
                http.get(
                    DEPOSIT_URL,
                    () =>
                        HttpResponse.json([
                            buildBinance.deposit({ id: 'dep-btc', coin: 'BTC', amount: '1' }),
                            buildBinance.deposit({ id: 'dep-eth', coin: 'ETH', amount: '2' })
                        ]),
                    { once: true }
                )
            );

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const firstTransactions = yield* client.getTransactions(
                BinanceHistorySourceEnum.CAPITAL,
                BINANCE_WINDOW_FROM,
                BINANCE_WINDOW_TO
            );
            const cachedTransactions = yield* client.getTransactions(
                BinanceHistorySourceEnum.CAPITAL,
                BINANCE_WINDOW_FROM,
                BINANCE_WINDOW_TO
            );

            expect(firstTransactions.map(transaction => transaction.id).sort()).toEqual(['dep-btc', 'dep-eth']);
            expect(cachedTransactions).toEqual(firstTransactions);
        }).pipe(Effect.provide(TestLayer))
    );
});
