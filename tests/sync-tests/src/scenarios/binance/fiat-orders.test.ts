import { PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchFiatOrderEntries,
    fetchBinanceTransactions,
    setupFiatScenario,
    TestLayer
} from '../../harness';

const EUR_100 = 100 * PRECISION;
const EUR_102 = 102 * PRECISION;
const EUR_2 = 2 * PRECISION;

describe('binance/fiat-orders', () => {
    it.effect('maps a fiat deposit to an INCOME transaction on the FIAT instrument account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-1', fiatCurrency: 'EUR', amount: '100' })], []);

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'fiat-dep-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a fiat withdrawal to an EXPENSE transaction', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders([], [buildBinance.fiatOrder({ orderNo: 'fiat-wd-1', fiatCurrency: 'EUR', amount: '50' })]);

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'fiat-wd-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('parks fiat orders without a matching instrument', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders(
                [
                    buildBinance.fiatOrder({ orderNo: 'fiat-eur', fiatCurrency: 'EUR', amount: '100' }),
                    buildBinance.fiatOrder({ orderNo: 'fiat-zzz', fiatCurrency: 'ZZZ', amount: '200' })
                ],
                []
            );

            yield* binanceSyncService.sync();

            const transactions = yield* fetchBinanceTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].externalId).toBe('fiat-eur');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { name: 'deposit', orderNo: 'fiat-dep-fee', isDeposit: true, mainType: TransactionEntryTypeEnum.DEBIT, mainAmount: EUR_102 },
        { name: 'withdrawal', orderNo: 'fiat-wd-fee', isDeposit: false, mainType: TransactionEntryTypeEnum.CREDIT, mainAmount: EUR_100 }
    ])('books a fiat $name of 100 EUR with a 2 EUR fee as the principal plus a fee entry', ({ orderNo, isDeposit, mainType, mainAmount }) =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const order = [buildBinance.fiatOrder({ orderNo, fiatCurrency: 'EUR', amount: '100', totalFee: '2' })];

            yield* setupFiatScenario();
            binanceStub.fiatOrders(isDeposit ? order : [], isDeposit ? [] : order);

            yield* binanceSyncService.sync();

            const { mainEntries, feeEntries } = yield* fetchFiatOrderEntries(orderNo);
            expect(mainEntries).toHaveLength(1);
            expect(feeEntries).toHaveLength(1);
            expect(mainEntries[0].type).toBe(mainType);
            expect(mainEntries[0].amount).toBe(mainAmount);
            expect(mainEntries[0].exchangeRate).toBe(1);
            expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
            expect(feeEntries[0].amount).toBe(EUR_2);
        }).pipe(Effect.provide(TestLayer))
    );
});
