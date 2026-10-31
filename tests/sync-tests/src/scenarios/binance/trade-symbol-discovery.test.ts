import { InstrumentTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { BinanceSignedClient, BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    BINANCE_TEST_TOKEN,
    binanceStub,
    buildBinance,
    fetchSortedBinanceExternalIds,
    seedCryptoInstrument,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

const SECONDS_PER_DAY = 86_400;
const MILLISECONDS_PER_SECOND = 1000;

describe('binance/trade-symbol-discovery', () => {
    it.effect('fetches BTCEUR trades once EUR is touched through a fiat deposit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('BTC');
            yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
            binanceStub.exchangeInfo(['BTCEUR']);
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-eur', fiatCurrency: 'EUR', amount: '100' })], []);
            binanceStub.myTrades({ BTCEUR: [buildBinance.fill('BTCEUR', 31)] });

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
            binanceStub.myTrades({ BTCBUSD: [buildBinance.fill('BTCBUSD', 32)] });

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
            binanceStub.myTrades({ ETHUSDC: [buildBinance.fill('ETHUSDC', 33)] });

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

    it.effect('keeps an asset known from the ledger touched for trades fetched in a later window', () =>
        Effect.gen(function* () {
            yield* setupBinanceFixture({ asset: 'USDT' });
            const nowSeconds = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
            const atDaysAgo = (days: number) => nowSeconds - days * SECONDS_PER_DAY;
            binanceStub.exchangeInfo(['BTCEUR']);
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
            binanceStub.myTrades({
                BTCEUR: [buildBinance.fill('BTCEUR', 34, { time: atDaysAgo(5) * MILLISECONDS_PER_SECOND })]
            });
            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            client.noteTouchedAssets(['EUR']);
            const accountId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'USDT' });

            const earlierWindow = yield* client.getTransfers(accountId, atDaysAgo(20), atDaysAgo(10));
            const laterWindow = yield* client.getTransfers(accountId, atDaysAgo(9), atDaysAgo(1));

            expect(earlierWindow).toHaveLength(0);
            expect(laterWindow.map(transfer => transfer.externalId)).toEqual(['binance:trade:BTCEUR:34']);
        }).pipe(Effect.provide(TestLayer))
    );
});
