import { ExternalSourceEnum, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSortedBinanceExternalIds,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    testDb,
    TestLayer
} from '../../harness';

const UNSAFE_ORDER_ID = 2 ** 60;
const SIBLING_ORDER_ID = UNSAFE_ORDER_ID + 1;

const stubUnsafeConverts = (quoteIds: readonly string[]): void => {
    binanceStub.convertTradeFlow(
        quoteIds.map(quoteId =>
            buildBinance.convertFlow({
                orderId: UNSAFE_ORDER_ID,
                quoteId,
                fromAsset: 'USDT',
                fromAmount: '100',
                toAsset: 'BTC',
                toAmount: '0.001'
            })
        )
    );
};

describe('binance/convert-order-id', () => {
    it.effect('imports both converts whose order ids collapse to the same JSON number', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            expect(SIBLING_ORDER_ID).toBe(UNSAFE_ORDER_ID);
            yield* seedCryptoInstrument('BTC');
            yield* setupUsdtSpotFixtureWithBalances('BTC', '1');
            stubUnsafeConverts(['quote-a', 'quote-b']);

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toStrictEqual(['binance:convert:quote-a', 'binance:convert:quote-b']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not re-import a convert already stored under its legacy order id', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('BTC');
            const { account } = yield* setupUsdtSpotFixtureWithBalances('BTC', '1');
            yield* testDb.insert(TransactionEntityTable).values({
                type: TransactionTypeEnum.TRANSFER,
                title: 'Binance convert USDT to BTC',
                externalId: `binance:convert:${UNSAFE_ORDER_ID}`,
                externalSource: ExternalSourceEnum.BINANCE,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: account.id,
                toAccountId: account.id,
                comment: '',
                updatedBy: null
            });
            stubUnsafeConverts(['quote-a']);

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
