import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum, InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceTransactions,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    TestLayer
} from '../../harness';

const setupFiatScenario = () => {
    setupBinanceFixture({ mode: SyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
    stubEmptyBinanceBalances();
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
};

describe('binance/fiat-orders', () => {
    it.effect('maps a fiat deposit to an INCOME transaction on the FIAT instrument account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupFiatScenario();
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-1', fiatCurrency: 'EUR', amount: '100' })], []);

            yield* binanceSyncService.sync();

            expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'fiat-dep-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a fiat withdrawal to an EXPENSE transaction', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupFiatScenario();
            binanceStub.fiatOrders([], [buildBinance.fiatOrder({ orderNo: 'fiat-wd-1', fiatCurrency: 'EUR', amount: '50' })]);

            yield* binanceSyncService.sync();

            expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'fiat-wd-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('parks fiat orders without a matching instrument', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupFiatScenario();
            binanceStub.fiatOrders(
                [
                    buildBinance.fiatOrder({ orderNo: 'fiat-eur', fiatCurrency: 'EUR', amount: '100' }),
                    buildBinance.fiatOrder({ orderNo: 'fiat-zzz', fiatCurrency: 'ZZZ', amount: '200' })
                ],
                []
            );

            yield* binanceSyncService.sync();

            const transactions = fetchBinanceTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].externalId).toBe('fiat-eur');
        }).pipe(Effect.provide(TestLayer))
    );
});
