import { PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    seedCryptoInstrument,
    setupFiatScenario,
    TestLayer
} from '../../harness';

const setupEurAndBtc = () =>
    Effect.gen(function* () {
        yield* seedCryptoInstrument('BTC');
        yield* setupFiatScenario();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'EUR', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
    });

describe('binance/fiat-payments', () => {
    it.effect('books a card purchase as BTC income quoted in the paid fiat amount', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupEurAndBtc();
            binanceStub.fiatPayments([
                buildBinance.fiatPayment({
                    orderNo: 'pay-card-1',
                    fiatCurrency: 'EUR',
                    cryptoCurrency: 'BTC',
                    sourceAmount: '50',
                    obtainAmount: '0.001',
                    price: '50000',
                    paymentMethod: 'Card'
                })
            ]);

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'binance:fiat-payment:pay-card-1');
            const [entry] = yield* fetchBinanceEntriesByExternalId('binance:fiat-payment:pay-card-1');
            expect(entry.amount).toBe(0.001 * PRECISION);
            expect(entry.quotedAmount).toBe(50 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a purchase from the fiat balance as a transfer from fiat to crypto', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupEurAndBtc();
            binanceStub.fiatPayments([
                buildBinance.fiatPayment({
                    orderNo: 'pay-cash-1',
                    fiatCurrency: 'EUR',
                    cryptoCurrency: 'BTC',
                    sourceAmount: '50',
                    obtainAmount: '0.001',
                    paymentMethod: 'Cash Balance'
                }),
                buildBinance.fiatPayment({
                    orderNo: 'pay-failed',
                    fiatCurrency: 'EUR',
                    cryptoCurrency: 'BTC',
                    sourceAmount: '10',
                    obtainAmount: '0.0002',
                    status: 'Failed',
                    paymentMethod: 'Cash Balance'
                })
            ]);

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, 'binance:fiat-payment:pay-cash-1');
            expect(
                (yield* fetchBinanceEntriesByExternalId('binance:fiat-payment:pay-cash-1'))
                    .map(entry => entry.amount)
                    .sort((left, right) => left - right)
            ).toEqual([0.001 * PRECISION, 50 * PRECISION]);
        }).pipe(Effect.provide(TestLayer))
    );
});
