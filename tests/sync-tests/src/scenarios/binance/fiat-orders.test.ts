import { SyncModeEnum, InstrumentTypeEnum, PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    TestLayer
} from '../../harness';

const setupFiatScenario = () =>
    Effect.gen(function* () {
        yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
        stubEmptyBinanceBalances();
        binanceStub.deposits([]);
        binanceStub.withdrawals([]);
    });

const EUR_100 = 100 * PRECISION;
const EUR_102 = 102 * PRECISION;
const EUR_2 = 2 * PRECISION;

const fetchOrderEntries = (orderNo: string) =>
    Effect.gen(function* () {
        const mainEntries = yield* fetchBinanceEntriesByExternalId(orderNo);
        const feeEntries = yield* fetchBinanceEntriesByExternalId(`${orderNo}:fee`);

        return { mainEntries, feeEntries };
    });

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

    it.effect('books a fiat deposit of 100 EUR net with a 2 EUR fee as +102 gross income and a 2 fee entry (net +100)', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders(
                [buildBinance.fiatOrder({ orderNo: 'fiat-dep-fee', fiatCurrency: 'EUR', amount: '100', totalFee: '2' })],
                []
            );

            yield* binanceSyncService.sync();

            const { mainEntries, feeEntries } = yield* fetchOrderEntries('fiat-dep-fee');
            expect(mainEntries).toHaveLength(1);
            expect(feeEntries).toHaveLength(1);
            expect(mainEntries[0].type).toBe(TransactionEntryTypeEnum.DEBIT);
            expect(mainEntries[0].amount).toBe(EUR_102);
            expect(mainEntries[0].exchangeRate).toBe(1);
            expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
            expect(feeEntries[0].amount).toBe(EUR_2);
            expect(mainEntries[0].amount - feeEntries[0].amount).toBe(EUR_100);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a fiat withdrawal of 100 EUR with a 2 EUR fee as a 100 principal plus a 2 fee entry (net -102)', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders(
                [],
                [buildBinance.fiatOrder({ orderNo: 'fiat-wd-fee', fiatCurrency: 'EUR', amount: '100', totalFee: '2' })]
            );

            yield* binanceSyncService.sync();

            const { mainEntries, feeEntries } = yield* fetchOrderEntries('fiat-wd-fee');
            expect(mainEntries).toHaveLength(1);
            expect(feeEntries).toHaveLength(1);
            expect(mainEntries[0].type).toBe(TransactionEntryTypeEnum.CREDIT);
            expect(mainEntries[0].amount).toBe(EUR_100);
            expect(mainEntries[0].exchangeRate).toBe(1);
            expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
            expect(feeEntries[0].amount).toBe(EUR_2);
            expect(mainEntries[0].amount + feeEntries[0].amount).toBe(EUR_102);
        }).pipe(Effect.provide(TestLayer))
    );
});
