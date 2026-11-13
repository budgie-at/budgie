import { AccountTypeEnum, CurrencyEnum, InstrumentMarketDataJobStatusEnum, InstrumentTypeEnum, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Predicate from 'effect/Predicate';
import * as TestClock from 'effect/testing/TestClock';

import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { BinanceKlinesClient } from '../src/market-data/service/binance-klines-client.service';
import { KlinesHistoryService } from '../src/market-data/service/klines-history.service';

import { makeStatusHttpClientLayer, requireInstrumentByCode, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

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

const KlinesLayer = (respond: (url: URL) => { readonly status: number; readonly body: unknown }) =>
    KlinesHistoryService.layer.pipe(
        Layer.provideMerge(Layer.mergeAll(InstrumentDailyMarketPriceRepository.layer, makeStatusHttpClientLayer(respond))),
        Layer.provideMerge(TestLayer)
    );

const buildJob = (instrumentId: number, quoteInstrumentId: number) => ({
    id: 1,
    instrumentId,
    quoteInstrumentId,
    fromDate: '2024-05-10',
    toDate: '2024-05-11',
    priority: 1,
    status: InstrumentMarketDataJobStatusEnum.RUNNING,
    attempts: 1,
    lockedAt: null,
    lastError: null,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null
});

describe('klines history jobs', () => {
    it.effect('quotes klines prices in USDT and stores the EURUSDT bridge both ways', () =>
        Effect.gen(function* () {
            const service = yield* KlinesHistoryService;
            const bitcoin = yield* requireInstrumentByCode('BTC');
            const tether = yield* requireInstrumentByCode('USDT');
            const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
            const result = yield* service.fetchJobData(bitcoin, buildJob(bitcoin.id, tether.id));

            expect(result.prices).toStrictEqual([
                {
                    instrumentId: bitcoin.id,
                    quoteInstrumentId: tether.id,
                    priceDate: '2024-05-10',
                    price: 60_000,
                    marketCap: null,
                    volume: null,
                    source: 'binance.vision'
                }
            ]);
            expect(result.rates).toContainEqual({
                sourceInstrumentId: tether.id,
                targetInstrumentId: euro.id,
                rateDate: '2024-05-10',
                rate: 1 / 1.08
            });
            expect(result.rates).toContainEqual({
                sourceInstrumentId: euro.id,
                targetInstrumentId: tether.id,
                rateDate: '2024-05-10',
                rate: 1.08
            });
        }).pipe(
            Effect.provide(
                KlinesLayer(url =>
                    url.searchParams.get('symbol') === 'EURUSDT'
                        ? { status: 200, body: [kline('2024-05-10', 1.08)] }
                        : { status: 200, body: [kline('2024-05-10', 60_000)] }
                )
            )
        )
    );

    it.effect('reports the instrument unsupported on an invalid symbol', () =>
        Effect.gen(function* () {
            const service = yield* KlinesHistoryService;
            const coin = yield* testSeedService.instrument({ code: 'TZZ', name: 'TZZ', symbol: 'TZZ', type: InstrumentTypeEnum.CRYPTO });
            const tether = yield* requireInstrumentByCode('USDT');
            const result = yield* service.fetchJobData(coin, buildJob(coin.id, tether.id));

            expect(result.unsupportedInstruments.map(instrument => instrument.id)).toStrictEqual([coin.id]);
            expect(result.prices).toStrictEqual([]);
        }).pipe(Effect.provide(KlinesLayer(() => invalidSymbol)))
    );

    it.effect('windows a job from the oldest entry to the day before the earliest CoinGecko price', () =>
        Effect.gen(function* () {
            const service = yield* KlinesHistoryService;
            const dailyPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
            const tether = yield* requireInstrumentByCode('USDT');
            const coin = yield* testSeedService.instrument({ code: 'TKW1', name: 'TKW1', symbol: 'TKW1', type: InstrumentTypeEnum.CRYPTO });
            const account = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });

            yield* setDefaultInstrument(euro.id);
            yield* testSeedService.valuedIncome({
                accountId: account.id,
                amount: PRECISION,
                operatedAt: new Date('2023-02-01T10:00:00.000Z'),
                title: 'Reward',
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });

            expect(yield* service.buildJobInput(coin.id, euro.id, tether.id)).toBeNull();

            yield* dailyPriceRepository.bulkUpsert([
                {
                    instrumentId: coin.id,
                    quoteInstrumentId: euro.id,
                    priceDate: '2025-11-14',
                    price: 1,
                    marketCap: null,
                    volume: null,
                    source: 'test'
                }
            ]);

            expect(yield* service.buildJobInput(coin.id, euro.id, tether.id)).toStrictEqual({
                instrumentId: coin.id,
                quoteInstrumentId: tether.id,
                fromDate: '2023-02-01',
                toDate: '2025-11-13',
                priority: 1
            });
        }).pipe(Effect.provide(KlinesLayer(() => ({ status: 200, body: [] }))))
    );
});
