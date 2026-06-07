import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BankSyncModeEnum, ExternalSourceEnum, InstrumentTypeEnum, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, setupBinanceFixture, testDb } from '../../harness';

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

const stubEmptyCryptoHistory = () => {
    binanceStub.spotBalances([]);
    binanceStub.fundingBalances([]);
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
};

describe('binance/fiat-orders', () => {
    it('maps a fiat deposit to an INCOME transaction on the FIAT instrument account', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
        stubEmptyCryptoHistory();
        binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-dep-1', fiatCurrency: 'EUR', amount: '100' })], []);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.INCOME);
        expect(transactions[0].externalId).toBe('fiat-dep-1');
    });

    it('maps a fiat withdrawal to an EXPENSE transaction', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
        stubEmptyCryptoHistory();
        binanceStub.fiatOrders([], [buildBinance.fiatOrder({ orderNo: 'fiat-wd-1', fiatCurrency: 'EUR', amount: '50' })]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.EXPENSE);
        expect(transactions[0].externalId).toBe('fiat-wd-1');
    });

    it('only syncs fiat orders matching the account asset', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });
        stubEmptyCryptoHistory();
        binanceStub.fiatOrders(
            [
                buildBinance.fiatOrder({ orderNo: 'fiat-eur', fiatCurrency: 'EUR', amount: '100' }),
                buildBinance.fiatOrder({ orderNo: 'fiat-usd', fiatCurrency: 'USD', amount: '200' })
            ],
            []
        );

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].externalId).toBe('fiat-eur');
    });
});
