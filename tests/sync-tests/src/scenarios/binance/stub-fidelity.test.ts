import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSortedBinanceExternalIds,
    seedCryptoInstrument,
    setupBinanceFixture,
    setupFiatScenario,
    setupUsdtSpotFixtureWithBalances,
    TestLayer
} from '../../harness';

const FIAT_ORDER_COUNT = 501;
const HEAVY_IMPORT_TIMEOUT_MS = 30_000;
const TRADE_COUNT = 1200;
const TRADE_BATCH_SIZE = 1000;
const SERVER_TIME_OFFSET_MS = 5 * 60 * 1000;
const TIMESTAMP_TOLERANCE_MS = 30_000;
const SECOND_MS = 1000;

const buildFiatOrders = () =>
    Array.from({ length: FIAT_ORDER_COUNT }, (_value, index) =>
        buildBinance.fiatOrder({
            orderNo: `fiat-page-${index}`,
            fiatCurrency: 'EUR',
            amount: '1',
            createTime: Date.now() - index * SECOND_MS
        })
    );

const buildAdaFills = () =>
    Array.from({ length: TRADE_COUNT }, (_value, index) =>
        buildBinance.fill('ADAUSDT', index + 1, { qty: '1', quoteQty: '0.01', time: Date.now() - (TRADE_COUNT - index) * SECOND_MS })
    );

describe('binance/stub-fidelity', () => {
    it.effect('imports a fiat history that spans more than one 500-row page', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders(buildFiatOrders(), []);

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(FIAT_ORDER_COUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'continues myTrades from fromId when the first 1000-trade batch is full',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                yield* seedCryptoInstrument('ADA');
                yield* setupUsdtSpotFixtureWithBalances('ADA', String(TRADE_COUNT));
                const requestedUrls: URL[] = [];
                binanceStub.myTrades({ ADAUSDT: buildAdaFills() }, new Set<string>(), requestedUrls);

                yield* binanceSyncService.sync();

                const adaRequests = requestedUrls.filter(url => url.searchParams.get('symbol') === 'ADAUSDT');
                const tradeIds = (yield* fetchSortedBinanceExternalIds()).filter(externalId =>
                    externalId?.startsWith('binance:trade:ADAUSDT:')
                );
                expect(adaRequests.map(url => url.searchParams.get('fromId'))).toStrictEqual([null, String(TRADE_BATCH_SIZE + 1)]);
                expect(tradeIds).toHaveLength(TRADE_COUNT);
            }).pipe(Effect.provide(TestLayer)),
        HEAVY_IMPORT_TIMEOUT_MS
    );

    it.effect('signs requests with the Binance server time when the local clock is off', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupBinanceFixture({ asset: 'USDT', serverTimeOffsetMs: SERVER_TIME_OFFSET_MS });
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'ADA', free: '1' })
            ]);
            const requestedUrls: URL[] = [];
            binanceStub.myTrades({ ADAUSDT: [buildBinance.fill('ADAUSDT', 1)] }, new Set<string>(), requestedUrls);

            yield* binanceSyncService.sync();

            expect(requestedUrls.length).toBeGreaterThan(0);
            for (const url of requestedUrls) {
                expect(Math.abs(Number(url.searchParams.get('timestamp')) - (Date.now() + SERVER_TIME_OFFSET_MS))).toBeLessThan(
                    TIMESTAMP_TOLERANCE_MS
                );
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
