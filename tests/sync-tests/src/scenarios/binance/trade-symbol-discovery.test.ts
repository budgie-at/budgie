import { InstrumentTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchSortedBinanceExternalIds,
    seedCryptoInstrument,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

const buildFillStub = (symbol: string, id: number) =>
    buildBinance.trade({ symbol, id, qty: '1', quoteQty: '1', commission: '0', isBuyer: true });

describe('binance/trade-symbol-discovery', () => {
    it.effect('fetches BTCEUR trades once EUR is touched through a fiat deposit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('BTC');
            yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
            binanceStub.exchangeInfo(['BTCEUR']);
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-eur', fiatCurrency: 'EUR', amount: '100' })], []);
            binanceStub.myTrades({ BTCEUR: [buildFillStub('BTCEUR', 31)] });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['binance:trade:BTCEUR:31', 'fiat-dep-eur']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fetches trades of a BREAK symbol such as BTCBUSD', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('BTC');
            yield* setupBinanceFixture({ asset: 'BUSD' });
            binanceStub.exchangeInfo([{ baseAsset: 'BTC', quoteAsset: 'BUSD', status: 'BREAK' }]);
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
            binanceStub.myTrades({ BTCBUSD: [buildFillStub('BTCBUSD', 32)] });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['binance:trade:BTCBUSD:32']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fetches ETHUSDC trades although USDC is not a major quote asset', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ETH');
            yield* setupBinanceFixture({ asset: 'USDC' });
            binanceStub.exchangeInfo(['ETHUSDC']);
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'ETH', free: '1' }),
                buildBinance.balance({ asset: 'USDC', free: '100' })
            ]);
            binanceStub.myTrades({ ETHUSDC: [buildFillStub('ETHUSDC', 33)] });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['binance:trade:ETHUSDC:33']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not query pairs whose quote asset the user never touched', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('BTC');
            yield* setupBinanceFixture({ asset: 'USDC' });
            binanceStub.exchangeInfo(['BTCTRY', 'BTCBRL', 'ETHUSDC']);
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'BTC', free: '1' }),
                buildBinance.balance({ asset: 'ETH', free: '1' }),
                buildBinance.balance({ asset: 'USDC', free: '100' })
            ]);
            const requestedSymbols = new Set<string>();
            binanceStub.myTrades({}, requestedSymbols);

            yield* binanceSyncService.sync();

            expect([...requestedSymbols]).toEqual(['ETHUSDC']);
        }).pipe(Effect.provide(TestLayer))
    );
});
