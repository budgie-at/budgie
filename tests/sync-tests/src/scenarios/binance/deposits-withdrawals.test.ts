import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable, SyncModeEnum, PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    resetBinanceSyncForResync,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb
} from '../../harness';

import type { BinanceDepositApiInterface, BinanceWithdrawalApiInterface } from '@budgie/sync';

const HOUR_MS = 60 * 60 * 1000;

const stubCapitalHistory = (deposits: BinanceDepositApiInterface[], withdrawals: BinanceWithdrawalApiInterface[]): void => {
    binanceStub.deposits(deposits);
    binanceStub.withdrawals(withdrawals);
};

describe('binance/deposits-withdrawals', () => {
    it('maps a deposit to an INCOME transaction', async () => {
        setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        stubEmptyBinanceBalances();
        stubCapitalHistory([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2' })], []);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'dep-1');
    });

    it('maps a fee-bearing withdrawal to an EXPENSE with a separate FEE entry that reconciles to gross', async () => {
        setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        stubEmptyBinanceBalances();
        stubCapitalHistory([], [buildBinance.withdrawal({ id: 'wd-1', coin: 'BTC', amount: '1', transactionFee: '0.1' })]);

        await binanceSyncService.sync();

        const transactions = fetchBinanceTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.EXPENSE);

        const mainEntry = fetchBinanceEntriesByExternalId('wd-1');
        const feeEntry = fetchBinanceEntriesByExternalId('wd-1:fee');
        expect(mainEntry).toHaveLength(1);
        expect(feeEntry).toHaveLength(1);
        expect(mainEntry[0].type).toBe(TransactionEntryTypeEnum.CREDIT);
        expect(mainEntry[0].exchangeRate).toBe(1);
        expect(feeEntry[0].type).toBe(TransactionEntryTypeEnum.FEE);
        expect(mainEntry[0].amount + feeEntry[0].amount).toBe(PRECISION);
    });

    it('drops the fee for a degenerate fee >= amount withdrawal', async () => {
        setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        stubEmptyBinanceBalances();
        stubCapitalHistory([], [buildBinance.withdrawal({ id: 'wd-degen', coin: 'BTC', amount: '1', transactionFee: '1' })]);

        await binanceSyncService.sync();

        const mainEntry = fetchBinanceEntriesByExternalId('wd-degen');
        const feeEntry = fetchBinanceEntriesByExternalId('wd-degen:fee');
        expect(feeEntry).toHaveLength(0);
        expect(mainEntry[0].amount).toBe(PRECISION);
        expect(mainEntry[0].exchangeRate).toBe(1);
    });

    it('does not create duplicates on a second sync run', async () => {
        const staleForwardFrom = new Date(Date.now() - HOUR_MS);
        const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD, forwardSyncFromAt: staleForwardFrom });
        stubEmptyBinanceBalances();
        stubCapitalHistory([buildBinance.deposit({ id: 'dep-dup', coin: 'BTC', amount: '2' })], []);

        await binanceSyncService.sync();
        expect(fetchBinanceTransactions()).toHaveLength(1);

        resetBinanceSyncForResync();
        await testDb.update(SyncEntityTable).set({ forwardSyncFromAt: staleForwardFrom }).where(eq(SyncEntityTable.id, sync.id));
        stubCapitalHistory([buildBinance.deposit({ id: 'dep-dup', coin: 'BTC', amount: '2' })], []);
        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(1);
    });
});
