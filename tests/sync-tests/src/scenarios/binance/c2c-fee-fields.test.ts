import { SyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { HttpResponse, http } from 'msw';

import { BinanceC2cOrderListApiSchema } from '../../../../../packages/sync/src/binance/interface/binance-c2c-order-api.schema';
import { expectSingleBinanceTransaction, setupBinanceFixture, stubEmptyBinanceBalances, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const COMMISSION_ONLY_ORDER = {
    orderNumber: 'commission-only',
    tradeType: 'SELL',
    asset: 'USDT',
    fiat: 'UAH',
    amount: '100',
    totalPrice: '4100',
    unitPrice: '41',
    orderStatus: 'COMPLETED',
    createTime: Date.now(),
    commission: '0.2',
    advertisementRole: 'MAKER'
};

const COMMISSION_ONLY_RESPONSE = { code: '000000', message: 'success', data: [COMMISSION_ONLY_ORDER], total: 1, success: true };

describe('binance/c2c-fee-fields', () => {
    it.effect('preserves the documented crypto commission when takerCommission is absent', () =>
        Effect.gen(function* () {
            const response = yield* Schema.decodeEffect(BinanceC2cOrderListApiSchema)(COMMISSION_ONLY_RESPONSE);

            expect(response.data[0]).toMatchObject({ commission: '0.2' });
            expect(response.data[0]).not.toHaveProperty('takerCommission');
        })
    );

    it.effect('imports a completed commission-only order without rejecting the C2C response', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            stubEmptyBinanceBalances();
            mockServer.use(
                http.get('https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory', ({ request }) => {
                    const parameters = new URL(request.url).searchParams;
                    const data = parameters.get('tradeType') === 'SELL' && parameters.get('page') === '1' ? [COMMISSION_ONLY_ORDER] : [];

                    return HttpResponse.json({ ...COMMISSION_ONLY_RESPONSE, data });
                })
            );

            yield* binanceSyncService.sync();

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'binance:c2c:commission-only');
        }).pipe(Effect.provide(TestLayer))
    );
});
