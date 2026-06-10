import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum, InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceTransactions,
    setupBinanceFixture,
    stubEmptyBinanceBalances
} from '../../harness';

const setupFiatScenario = () => {
    setupBinanceFixture({ mode: SyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
    stubEmptyBinanceBalances();
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
};

describe('binance/fiat-orders', () => {
    it('maps a fiat deposit to an INCOME transaction on the FIAT instrument account', async () => {
        setupFiatScenario();
        binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-1', fiatCurrency: 'EUR', amount: '100' })], []);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'fiat-dep-1');
    });

    it('maps a fiat withdrawal to an EXPENSE transaction', async () => {
        setupFiatScenario();
        binanceStub.fiatOrders([], [buildBinance.fiatOrder({ orderNo: 'fiat-wd-1', fiatCurrency: 'EUR', amount: '50' })]);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'fiat-wd-1');
    });

    it('only syncs fiat orders matching the account asset', async () => {
        setupFiatScenario();
        binanceStub.fiatOrders(
            [
                buildBinance.fiatOrder({ orderNo: 'fiat-eur', fiatCurrency: 'EUR', amount: '100' }),
                buildBinance.fiatOrder({ orderNo: 'fiat-usd', fiatCurrency: 'USD', amount: '200' })
            ],
            []
        );

        await binanceSyncService.sync();

        const transactions = fetchBinanceTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].externalId).toBe('fiat-eur');
    });
});
