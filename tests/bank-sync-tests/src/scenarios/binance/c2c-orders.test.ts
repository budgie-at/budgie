import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BankSyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceTransactions,
    resetBinanceSyncForResync,
    setupBinanceFixture,
    stubEmptyBinanceBalances
} from '../../harness';

const setupForwardUsdtScenario = (): void => {
    setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
    stubEmptyBinanceBalances();
};

const stubBuyC2cOrder = (orderNumber: string): void => {
    binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber, tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
};

describe('binance/c2c-orders', () => {
    it('maps a P2P BUY order to an INCOME transaction on the asset account', async () => {
        setupForwardUsdtScenario();
        stubBuyC2cOrder('c2c-buy-1');

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'binance:c2c:c2c-buy-1');
    });

    it('maps a P2P SELL order to an EXPENSE transaction', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cOrders([], [buildBinance.c2cOrder({ orderNumber: 'c2c-sell-1', tradeType: 'SELL', asset: 'USDT', amount: '50' })]);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'binance:c2c:c2c-sell-1');
    });

    it('skips non-COMPLETED C2C orders', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cOrders(
            [buildBinance.c2cOrder({ orderNumber: 'c2c-pending', tradeType: 'BUY', asset: 'USDT', amount: '100', orderStatus: 'PENDING' })],
            []
        );

        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(0);
    });

    it('does not create duplicate C2C transactions on a second sync run', async () => {
        setupForwardUsdtScenario();
        stubBuyC2cOrder('c2c-dup');

        await binanceSyncService.sync();
        expect(fetchBinanceTransactions()).toHaveLength(1);

        resetBinanceSyncForResync();
        stubBuyC2cOrder('c2c-dup');
        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(1);
    });

    it('treats a 403 on the C2C endpoint as non-fatal and still syncs deposits', async () => {
        setupForwardUsdtScenario();
        binanceStub.c2cUnavailable();
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-after-c2c-403', coin: 'USDT', amount: '5' })]);

        await binanceSyncService.sync();

        const transactions = fetchBinanceTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].externalId).toBe('dep-after-c2c-403');
    });
});
