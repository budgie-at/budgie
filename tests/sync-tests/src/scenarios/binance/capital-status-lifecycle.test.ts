import {
    AccountBalanceRepository,
    AccountTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { AtmCashMoveService, BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchBinanceTransactions, resyncBinance, seed, testDb, testQueryService, TestLayer } from '../../harness';
import {
    DAY_MS,
    HOUR_MS,
    importedCountsAfterEachStatus,
    pendingAnchorAfterFirstSync,
    startForwardSync,
    stubDeposit,
    stubWithdrawal
} from '../../harness/binance/capital-status-fixture';

describe('binance/capital-status-lifecycle', () => {
    it.effect.each([
        { label: 'deposit', stubHistory: stubDeposit, pending: 0, completed: 1 },
        { label: 'withdrawal', stubHistory: stubWithdrawal, pending: 4, completed: 6 }
    ])('imports a pending $label exactly once after it completes beyond the forward overlap', ({ stubHistory, pending, completed }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(stubHistory, 3 * DAY_MS, [pending, completed, completed])).toEqual([0, 1, 1]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'rejected deposit', stubHistory: stubDeposit, imported: 1, failed: 2 },
        { label: 'wrong deposit', stubHistory: stubDeposit, imported: 1, failed: 7 },
        { label: 'cancelled withdrawal', stubHistory: stubWithdrawal, imported: 6, failed: 1 },
        { label: 'rejected withdrawal', stubHistory: stubWithdrawal, imported: 6, failed: 3 },
        { label: 'failed withdrawal', stubHistory: stubWithdrawal, imported: 6, failed: 5 }
    ])('removes a previously imported row that Binance now reports as a $label', ({ stubHistory, imported, failed }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(stubHistory, HOUR_MS / 2, [imported, failed])).toEqual([1, 0]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-imports a removed rejected deposit when Binance later reports it completed', () =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(stubDeposit, HOUR_MS / 2, [1, 2, 1])).toEqual([1, 0, 1]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', stubHistory: stubDeposit, imported: 1 },
        { label: 'withdrawal', stubHistory: stubWithdrawal, imported: 6 }
    ])('keeps a previously imported $label when Binance later omits its status', ({ stubHistory, imported }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(stubHistory, HOUR_MS / 2, [imported, undefined])).toEqual([1, 1]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', stubHistory: stubDeposit, ageDays: 100, isAnchored: true },
        { label: 'withdrawal', stubHistory: stubWithdrawal, ageDays: 100, isAnchored: true },
        { label: 'deposit', stubHistory: stubDeposit, ageDays: 200, isAnchored: false },
        { label: 'withdrawal', stubHistory: stubWithdrawal, ageDays: 200, isAnchored: false }
    ])('anchors the capital window: $label pending for $ageDays days -> $isAnchored', ({ stubHistory, ageDays, isAnchored }) =>
        Effect.gen(function* () {
            const pendingFrom = yield* pendingAnchorAfterFirstSync(stubHistory, ageDays * DAY_MS);

            expect(pendingFrom instanceof Date).toBe(isAnchored);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('removes the ledger money of a consolidated withdrawal that Binance now reports as rejected', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const atmCashMoveService = yield* AtmCashMoveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { sync, instrument } = yield* startForwardSync;
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: instrument.id });
            const timeMs = Date.now() - HOUR_MS / 2;

            stubWithdrawal(6, timeMs);
            yield* binanceSyncService.sync();
            const [withdrawal] = yield* fetchBinanceTransactions;
            const cashWithdrawalMcc = yield* testQueryService.findMccByCode('6011');
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ mccCategoryId: cashWithdrawalMcc.id })
                .where(eq(TransactionEntryEntityTable.transactionId, withdrawal.id));
            expect(yield* atmCashMoveService.moveToCash([withdrawal.id])).toEqual([withdrawal.id]);
            expect((yield* testQueryService.findTransactionById(withdrawal.id)).consolidationParentTransactionId).not.toBeNull();

            stubWithdrawal(3, timeMs);
            yield* resyncBinance(sync.id);

            expect(yield* fetchBinanceTransactions).toHaveLength(0);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(0);
            expect((yield* accountBalanceRepository.getLedgerBalances([cashAccount.id])).get(cashAccount.id) ?? 0).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
