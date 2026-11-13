import { InstrumentMarketDataJobStatusEnum, PRECISION } from '@budgie/contracts';
import { HistoricalMarketDataService } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { http, HttpResponse } from 'msw';

import { isDefined } from '@rnw-community/shared';

import { fetchEntryValuation, requireInstrument, seed, seedCryptoSyncAccount, seedDailyPrice, testDb, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const dayMs = 86_400_000;
const rewardDay = '2024-01-10';
const coinOpen = 40_000;
const euroOpen = 1.1;

const kline = (day: string, open: number) => {
    const openTime = Date.parse(`${day}T00:00:00.000Z`);

    return [openTime, String(open), '0', '0', '0', '0', openTime + dayMs - 1, '0', 0, '0', '0', '0'];
};

const readJobStatuses = testDb.$client.unsafe<{
    readonly instrumentId: number;
    readonly quoteInstrumentId: number;
    readonly status: string;
}>('SELECT instrument_id AS instrumentId, quote_instrument_id AS quoteInstrumentId, status FROM instrument_market_data_jobs');

const runKlinesJob = Effect.gen(function* () {
    const historicalMarketDataService = yield* HistoricalMarketDataService;
    const tether = yield* requireInstrument('USDT');

    yield* Effect.forEach(
        Array.from({ length: 4 }),
        () =>
            Effect.gen(function* () {
                const job = yield* historicalMarketDataService.claimNextJob;

                if (isDefined(job) && job.quoteInstrumentId === tether.id) {
                    yield* historicalMarketDataService.storeJobData(job, yield* historicalMarketDataService.fetchJobData(job));
                }
            }),
        { discard: true }
    );
});

describe('market-data/crypto-klines-bridge', () => {
    it.effect('prices a reward older than the CoinGecko history through the USDT to EUR bridge', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const { euro, coin, account } = yield* seedCryptoSyncAccount('BTC');
            const { entry } = yield* seed.valuedIncome({
                accountId: account.id,
                amount: PRECISION,
                operatedAt: new Date(`${rewardDay}T09:00:00.000Z`),
                title: 'Reward',
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });

            mockServer.use(
                http.get('https://data-api.binance.vision/api/v3/klines', ({ request }) => {
                    const symbol = new URL(request.url).searchParams.get('symbol');

                    return HttpResponse.json([kline(rewardDay, symbol === 'EURUSDT' ? euroOpen : coinOpen)]);
                })
            );
            yield* seedDailyPrice(coin.id, euro.id, '2025-11-14', 90_000);
            yield* historicalMarketDataService.enqueueAccounts([account]);
            yield* runKlinesJob;

            const valuation = yield* fetchEntryValuation(testDb, entry.id);

            expect(valuation.baseInstrumentId).toBe(euro.id);
            expect(valuation.baseExchangeRate).toBeCloseTo(coinOpen / euroOpen, 6);
            expect(valuation.baseAmount).toBeCloseTo((coinOpen / euroOpen) * PRECISION, 0);
        }).pipe(Effect.provide(HistoricalMarketDataService.layer.pipe(Layer.provideMerge(TestLayer))))
    );

    it.effect('marks the USDT job unsupported when Binance lists no pair for the coin', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const { euro, coin, account } = yield* seedCryptoSyncAccount('DOGE');

            yield* seed.valuedIncome({
                accountId: account.id,
                amount: PRECISION,
                operatedAt: new Date(`${rewardDay}T09:00:00.000Z`),
                title: 'Reward',
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });
            mockServer.use(
                http.get('https://data-api.binance.vision/api/v3/klines', () =>
                    HttpResponse.json({ code: -1121, msg: 'Invalid symbol.' }, { status: 400 })
                )
            );
            yield* seedDailyPrice(coin.id, euro.id, '2025-11-14', 0.1);
            yield* historicalMarketDataService.enqueueAccounts([account]);
            yield* runKlinesJob;

            const tether = yield* requireInstrument('USDT');

            expect((yield* readJobStatuses).find(row => row.instrumentId === coin.id && row.quoteInstrumentId === tether.id)?.status).toBe(
                InstrumentMarketDataJobStatusEnum.UNSUPPORTED
            );
        }).pipe(Effect.provide(HistoricalMarketDataService.layer.pipe(Layer.provideMerge(TestLayer))))
    );
});
