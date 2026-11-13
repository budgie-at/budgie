import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Predicate from 'effect/Predicate';
import * as TestClock from 'effect/testing/TestClock';

import { BinanceKlinesClient } from '../src/market-data/service/binance-klines-client.service';

import { makeStatusHttpClientLayer } from './test-context';

const dayMs = 86_400_000;

const kline = (day: string, open: number) => {
    const openTime = Date.parse(`${day}T00:00:00.000Z`);

    return [openTime, String(open), '0', '0', '0', '0', openTime + dayMs - 1, '0', 0, '0', '0', '0'];
};

const invalidSymbol = { status: 400, body: { code: -1121, msg: 'Invalid symbol.' } };

const provideClient = (respond: (url: URL) => { readonly status: number; readonly body: unknown }) =>
    Effect.provide(BinanceKlinesClient.layer.pipe(Layer.provideMerge(makeStatusHttpClientLayer(respond))));

describe('Binance klines client', () => {
    it.effect('decodes daily opens and merges a renamed pair by day, current symbol first', () =>
        Effect.gen(function* () {
            const client = yield* BinanceKlinesClient;

            expect(yield* client.fetchInstrumentDailyOpens('POL', '2024-09-12', '2024-09-14')).toStrictEqual([
                { priceDate: '2024-09-12', price: 0.38 },
                { priceDate: '2024-09-13', price: 0.4 },
                { priceDate: '2024-09-14', price: 0.41 }
            ]);
        }).pipe(
            provideClient(url => {
                const symbol = url.searchParams.get('symbol');

                if (symbol === 'POLUSDT') {
                    return { status: 200, body: [kline('2024-09-13', 0.4), kline('2024-09-14', 0.41)] };
                }

                return { status: 200, body: [kline('2024-09-12', 0.38), kline('2024-09-13', 0.99)] };
            })
        )
    );

    it.effect('splits windows longer than 1000 days into pages', () => {
        const requests: string[] = [];

        return Effect.gen(function* () {
            const client = yield* BinanceKlinesClient;

            yield* client.fetchInstrumentDailyOpens('BTC', '2020-01-01', '2023-01-01');

            expect(requests).toHaveLength(2);
        }).pipe(
            provideClient(url => {
                requests.push(url.searchParams.get('startTime') ?? '');

                return { status: 200, body: [] };
            })
        );
    });

    it.effect('fails with an invalid-symbol error when no pair exists', () =>
        Effect.gen(function* () {
            const client = yield* BinanceKlinesClient;
            const error = yield* Effect.flip(client.fetchInstrumentDailyOpens('TZZ', '2024-01-01', '2024-01-02'));

            expect(Predicate.isTagged(error, 'BinanceKlinesInvalidSymbolError')).toBe(true);
        }).pipe(provideClient(() => invalidSymbol))
    );

    it.effect('retries 429 and 451 responses', () => {
        const statuses = [429, 451, 200];
        let calls = 0;

        return Effect.gen(function* () {
            const client = yield* BinanceKlinesClient;
            const fiber = yield* Effect.forkChild(client.fetchInstrumentDailyOpens('BTC', '2024-01-01', '2024-01-01'));

            yield* TestClock.adjust('10 seconds');

            expect(yield* Fiber.join(fiber)).toStrictEqual([{ priceDate: '2024-01-01', price: 42_000 }]);
            expect(calls).toBe(3);
        }).pipe(
            provideClient(() => {
                const status = statuses[calls] ?? 200;

                calls += 1;

                return { status, body: status === 200 ? [kline('2024-01-01', 42_000)] : {} };
            })
        );
    });

    it.effect('gives up on repeated 451 without reporting an invalid symbol', () =>
        Effect.gen(function* () {
            const client = yield* BinanceKlinesClient;
            const fiber = yield* Effect.forkChild(client.fetchInstrumentDailyOpens('BTC', '2024-01-01', '2024-01-01').pipe(Effect.flip));

            yield* TestClock.adjust('10 seconds');

            expect(Predicate.isTagged(yield* Fiber.join(fiber), 'BinanceKlinesInvalidSymbolError')).toBe(false);
        }).pipe(provideClient(() => ({ status: 451, body: {} })))
    );
});
