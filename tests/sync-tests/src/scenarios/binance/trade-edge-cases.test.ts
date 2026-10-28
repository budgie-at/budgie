import { TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchSortedBinanceExternalIds,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    TestLayer
} from '../../harness';

const SELF_TRADE_ID = 20;
const LARGE_FILL_ID = 30;
const TINY_COMMISSION_FILL_ID = 31;

describe('binance/trade-edge-cases', () => {
    it.effect('imports a 2e10 PEPE fill instead of dropping it', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('PEPE');
            yield* setupUsdtSpotFixtureWithBalances('PEPE', '1');
            binanceStub.myTrades({
                PEPEUSDT: [
                    buildBinance.trade({
                        symbol: 'PEPEUSDT',
                        id: LARGE_FILL_ID,
                        qty: '20000000000',
                        quoteQty: '20000',
                        commission: '0',
                        isBuyer: true
                    })
                ]
            });

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, `binance:trade:PEPEUSDT:${LARGE_FILL_ID}`);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        {
            name: 'a fill whose commission is in scientific notation',
            trades: [{ id: TINY_COMMISSION_FILL_ID, commission: '1E-8', commissionAsset: 'USDT', isBuyer: true }],
            expectedIds: [`binance:trade:ADAUSDT:${TINY_COMMISSION_FILL_ID}`]
        },
        {
            name: 'a fill whose commission cannot be parsed with no fee',
            trades: [{ id: TINY_COMMISSION_FILL_ID, commission: 'n/a', commissionAsset: 'BNB', isBuyer: true }],
            expectedIds: [`binance:trade:ADAUSDT:${TINY_COMMISSION_FILL_ID}`]
        },
        {
            name: 'both sides of a self-trade so it nets to the fee only',
            trades: [
                { id: SELF_TRADE_ID, commission: '0', commissionAsset: 'BNB', isBuyer: true },
                { id: SELF_TRADE_ID, commission: '0.5', commissionAsset: 'USDT', isBuyer: false }
            ],
            expectedIds: [`binance:trade:ADAUSDT:${SELF_TRADE_ID}`, `binance:trade:ADAUSDT:${SELF_TRADE_ID}:sell`]
        }
    ])('imports $name', ({ trades, expectedIds }) =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
            binanceStub.myTrades({
                ADAUSDT: trades.map(trade => buildBinance.trade({ symbol: 'ADAUSDT', qty: '200', quoteQty: '100', ...trade }))
            });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toStrictEqual(expectedIds);
        }).pipe(Effect.provide(TestLayer))
    );
});
