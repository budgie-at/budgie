import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BankSyncModeEnum, ExternalSourceEnum, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, setupBinanceFixture, testDb } from '../../harness';

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

describe('binance/c2c-orders', () => {
    it('maps a P2P BUY order to an INCOME transaction on the asset account', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'c2c-buy-1', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.INCOME);
        expect(transactions[0].externalId).toBe('binance:c2c:c2c-buy-1');
    });

    it('maps a P2P SELL order to an EXPENSE transaction', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.c2cOrders([], [buildBinance.c2cOrder({ orderNumber: 'c2c-sell-1', tradeType: 'SELL', asset: 'USDT', amount: '50' })]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.EXPENSE);
        expect(transactions[0].externalId).toBe('binance:c2c:c2c-sell-1');
    });

    it('skips non-COMPLETED C2C orders', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.c2cOrders(
            [buildBinance.c2cOrder({ orderNumber: 'c2c-pending', tradeType: 'BUY', asset: 'USDT', amount: '100', orderStatus: 'PENDING' })],
            []
        );

        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(0);
    });

    it('does not create duplicate C2C transactions on a second sync run', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'c2c-dup', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);

        await binanceSyncService.sync();
        expect(fetchTransactions()).toHaveLength(1);

        Object.assign(binanceSyncService, { isRunning: false });
        binanceStub.serverTime();
        binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'c2c-dup', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(1);
    });

    it('treats a 403 on the C2C endpoint as non-fatal and still syncs deposits', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.c2cUnavailable();
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-after-c2c-403', coin: 'USDT', amount: '5' })]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].externalId).toBe('dep-after-c2c-403');
    });
});
