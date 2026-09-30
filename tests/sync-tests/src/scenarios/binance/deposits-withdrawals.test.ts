import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable, SyncModeEnum, PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSignedClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    binanceStub,
    buildBinance,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    resetBinanceSyncForResync,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb,
    TestLayer
} from '../../harness';

import type { BinanceDepositApiInterface, BinanceWithdrawalApiInterface } from '@budgie/sync';

const HOUR_MS = 60 * 60 * 1000;
const CAPITAL_PAGE_SIZE = 500;
const PAGE_OVERFLOW_SIZE = CAPITAL_PAGE_SIZE + 1;
const BINANCE_WINDOW_FROM_MS = BINANCE_WINDOW_FROM * 1000;

const stubCapitalHistory = (deposits: BinanceDepositApiInterface[], withdrawals: BinanceWithdrawalApiInterface[]): void => {
    binanceStub.deposits(deposits);
    binanceStub.withdrawals(withdrawals);
};

const expectFeeBearingWithdrawalEntries = (): void => {
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
};

const stubDuplicateDeposit = (): void => {
    stubCapitalHistory([buildBinance.deposit({ id: 'dep-dup', coin: 'BTC', amount: '2' })], []);
};

describe('binance/deposits-withdrawals', () => {
    it.effect.each([
        { historyType: 'deposit', expectedExternalId: 'dep-page-500' },
        { historyType: 'withdrawal', expectedExternalId: 'wd-page-500' }
    ])('fetches $historyType history beyond the first Binance offset page', ({ historyType, expectedExternalId }) =>
        Effect.gen(function* () {
            binanceStub.serverTime();
            const isDepositHistory = historyType === 'deposit';
            const deposits = isDepositHistory
                ? Array.from({ length: PAGE_OVERFLOW_SIZE }, (_value, index) =>
                      buildBinance.deposit({
                          id: `dep-page-${index}`,
                          coin: 'BTC',
                          amount: '1',
                          insertTime: BINANCE_WINDOW_FROM_MS + index
                      })
                  )
                : [];
            const withdrawals = isDepositHistory
                ? []
                : Array.from({ length: PAGE_OVERFLOW_SIZE }, (_value, index) =>
                      buildBinance.withdrawal({
                          id: `wd-page-${index}`,
                          coin: 'BTC',
                          amount: '1',
                          applyTime: new Date(BINANCE_WINDOW_FROM_MS + index).toISOString()
                      })
                  );
            binanceStub.deposits(deposits);
            binanceStub.withdrawals(withdrawals);

            const transactions = yield* new BinanceSignedClient(BINANCE_TEST_TOKEN).getCapitalTransactions(
                BINANCE_WINDOW_FROM,
                BINANCE_WINDOW_TO
            );

            expect(transactions).toHaveLength(PAGE_OVERFLOW_SIZE);
            expect(transactions.map(transaction => transaction.id)).toContain(expectedExternalId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a deposit to an INCOME transaction', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            stubEmptyBinanceBalances();
            stubCapitalHistory([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2' })], []);

            yield* binanceSyncService.sync();

            expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'dep-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a fee-bearing withdrawal to an EXPENSE with a separate FEE entry that reconciles to gross', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            stubEmptyBinanceBalances();
            stubCapitalHistory([], [buildBinance.withdrawal({ id: 'wd-1', coin: 'BTC', amount: '1', transactionFee: '0.1' })]);

            yield* binanceSyncService.sync();

            expectFeeBearingWithdrawalEntries();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('drops the fee for a degenerate fee >= amount withdrawal', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            stubEmptyBinanceBalances();
            stubCapitalHistory([], [buildBinance.withdrawal({ id: 'wd-degen', coin: 'BTC', amount: '1', transactionFee: '1' })]);

            yield* binanceSyncService.sync();

            const mainEntry = fetchBinanceEntriesByExternalId('wd-degen');
            const feeEntry = fetchBinanceEntriesByExternalId('wd-degen:fee');
            expect(feeEntry).toHaveLength(0);
            expect(mainEntry[0].amount).toBe(PRECISION);
            expect(mainEntry[0].exchangeRate).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not create duplicates on a second sync run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const staleForwardFrom = new Date(Date.now() - HOUR_MS);
            const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD, forwardSyncFromAt: staleForwardFrom });
            stubEmptyBinanceBalances();
            stubDuplicateDeposit();

            yield* binanceSyncService.sync();
            expect(fetchBinanceTransactions()).toHaveLength(1);

            resetBinanceSyncForResync();
            testDb.update(SyncEntityTable).set({ forwardSyncFromAt: staleForwardFrom }).where(eq(SyncEntityTable.id, sync.id)).run();
            stubDuplicateDeposit();
            yield* binanceSyncService.sync();

            expect(fetchBinanceTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
