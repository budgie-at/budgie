import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    BankSyncEntityTable,
    BankSyncModeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, setupBinanceFixture, testDb } from '../../harness';

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

const fetchEntriesByExternalId = (externalId: string) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId)).all();

describe('binance/deposits-withdrawals', () => {
    it('maps a deposit to an INCOME transaction', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2' })]);
        binanceStub.withdrawals([]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.INCOME);
        expect(transactions[0].externalId).toBe('dep-1');
    });

    it('maps a fee-bearing withdrawal to an EXPENSE with a separate FEE entry that reconciles to gross', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.deposits([]);
        binanceStub.withdrawals([buildBinance.withdrawal({ id: 'wd-1', coin: 'BTC', amount: '1', transactionFee: '0.1' })]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.EXPENSE);

        const mainEntry = fetchEntriesByExternalId('wd-1');
        const feeEntry = fetchEntriesByExternalId('wd-1:fee');
        expect(mainEntry).toHaveLength(1);
        expect(feeEntry).toHaveLength(1);
        expect(mainEntry[0].type).toBe(TransactionEntryTypeEnum.CREDIT);
        expect(mainEntry[0].exchangeRate).toBe(1);
        expect(feeEntry[0].type).toBe(TransactionEntryTypeEnum.FEE);
        expect(mainEntry[0].amount + feeEntry[0].amount).toBe(PRECISION);
    });

    it('drops the fee for a degenerate fee >= amount withdrawal', async () => {
        setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.deposits([]);
        binanceStub.withdrawals([buildBinance.withdrawal({ id: 'wd-degen', coin: 'BTC', amount: '1', transactionFee: '1' })]);

        await binanceSyncService.sync();

        const mainEntry = fetchEntriesByExternalId('wd-degen');
        const feeEntry = fetchEntriesByExternalId('wd-degen:fee');
        expect(feeEntry).toHaveLength(0);
        expect(mainEntry[0].amount).toBe(PRECISION);
        expect(mainEntry[0].exchangeRate).toBe(1);
    });

    it('does not create duplicates on a second sync run', async () => {
        const staleForwardFrom = new Date(Date.now() - 60 * 60 * 1000);
        const { bankSync } = setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD, forwardSyncFromAt: staleForwardFrom });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-dup', coin: 'BTC', amount: '2' })]);
        binanceStub.withdrawals([]);

        await binanceSyncService.sync();
        expect(fetchTransactions()).toHaveLength(1);

        Object.assign(binanceSyncService, { isRunning: false });
        await testDb
            .update(BankSyncEntityTable)
            .set({ forwardSyncFromAt: staleForwardFrom })
            .where(eq(BankSyncEntityTable.id, bankSync.id));
        binanceStub.serverTime();
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-dup', coin: 'BTC', amount: '2' })]);
        binanceStub.withdrawals([]);
        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(1);
    });
});
