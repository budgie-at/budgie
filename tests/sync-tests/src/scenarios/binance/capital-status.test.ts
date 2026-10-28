import {
    AccountBalanceRepository,
    AccountTypeEnum,
    SyncEntityTable,
    SyncModeEnum,
    SyncStatusEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { AtmCashMoveService, BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSyncById,
    resetBinanceSyncForResync,
    seed,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb,
    TestLayer,
    testQueryService
} from '../../harness';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const depositHistory = {
    stub: (status: number | undefined, timeMs: number): void => {
        binanceStub.deposits([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2', insertTime: timeMs, status })]);
    }
};

const withdrawalHistory = {
    stub: (status: number | undefined, timeMs: number): void => {
        binanceStub.withdrawals([
            buildBinance.withdrawal({
                id: 'wd-1',
                coin: 'BTC',
                amount: '1',
                transactionFee: '0.1',
                applyTime: new Date(timeMs).toISOString(),
                status
            })
        ]);
    }
};

const syncAgain = (syncId: number) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        resetBinanceSyncForResync();
        yield* testDb
            .update(SyncEntityTable)
            .set({ forwardSyncedAt: new Date(Date.now() - HOUR_MS), status: SyncStatusEnum.IDLE })
            .where(eq(SyncEntityTable.id, syncId));
        yield* binanceSyncService.sync();
    });

const startForwardSync = () =>
    Effect.gen(function* () {
        const fixture = yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, forwardSyncFromAt: new Date(Date.now() - HOUR_MS) });
        stubEmptyBinanceBalances();

        return fixture;
    });

const importedCountsAfterEachStatus = (history: typeof depositHistory, ageMs: number, statuses: readonly (number | undefined)[]) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        const { sync } = yield* startForwardSync();
        const timeMs = Date.now() - ageMs;
        const counts: number[] = [];

        for (const [index, status] of statuses.entries()) {
            history.stub(status, timeMs);
            yield* index === 0 ? binanceSyncService.sync() : syncAgain(sync.id);
            counts.push((yield* fetchBinanceTransactions()).length);
        }

        return counts;
    });

const pendingFloorAfterFirstSync = (history: typeof depositHistory, ageMs: number) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        const { sync } = yield* startForwardSync();
        history.stub(0, Date.now() - ageMs);

        yield* binanceSyncService.sync();

        return (yield* fetchSyncById(sync.id)).binanceCapitalPendingFromAt;
    });

describe('binance/capital-status', () => {
    it.effect.each([
        { label: 'pending deposit', history: depositHistory, statuses: [0], counts: [0] },
        { label: 'rejected deposit', history: depositHistory, statuses: [2], counts: [0] },
        { label: 'wrong deposit', history: depositHistory, statuses: [7], counts: [0] },
        { label: 'deposit waiting for user confirmation', history: depositHistory, statuses: [8], counts: [0] },
        { label: 'successful deposit', history: depositHistory, statuses: [1], counts: [1] },
        { label: 'credited deposit that cannot withdraw', history: depositHistory, statuses: [6], counts: [1] },
        { label: 'withdrawal with email sent', history: withdrawalHistory, statuses: [0], counts: [0] },
        { label: 'withdrawal awaiting approval', history: withdrawalHistory, statuses: [2], counts: [0] },
        { label: 'cancelled withdrawal', history: withdrawalHistory, statuses: [1], counts: [0] },
        { label: 'rejected withdrawal', history: withdrawalHistory, statuses: [3], counts: [0] },
        { label: 'processing withdrawal', history: withdrawalHistory, statuses: [4], counts: [0] },
        { label: 'failed withdrawal', history: withdrawalHistory, statuses: [5], counts: [0] },
        { label: 'completed withdrawal', history: withdrawalHistory, statuses: [6], counts: [1] },
        { label: 'deposit without a status', history: depositHistory, statuses: [undefined], counts: [0] },
        { label: 'withdrawal without a status', history: withdrawalHistory, statuses: [undefined], counts: [0] }
    ])('imports a $label only when it is final-success', ({ history, statuses, counts }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(history, HOUR_MS / 2, statuses)).toEqual(counts);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', history: depositHistory, pending: 0, completed: 1 },
        { label: 'withdrawal', history: withdrawalHistory, pending: 4, completed: 6 }
    ])('imports a pending $label exactly once after it completes beyond the forward overlap', ({ history, pending, completed }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(history, 3 * DAY_MS, [pending, completed, completed])).toEqual([0, 1, 1]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'rejected deposit', history: depositHistory, imported: 1, failed: 2 },
        { label: 'wrong deposit', history: depositHistory, imported: 1, failed: 7 },
        { label: 'cancelled withdrawal', history: withdrawalHistory, imported: 6, failed: 1 },
        { label: 'rejected withdrawal', history: withdrawalHistory, imported: 6, failed: 3 },
        { label: 'failed withdrawal', history: withdrawalHistory, imported: 6, failed: 5 }
    ])('removes a previously imported row that Binance now reports as a $label', ({ history, imported, failed }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(history, HOUR_MS / 2, [imported, failed])).toEqual([1, 0]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', history: depositHistory, imported: 1 },
        { label: 'withdrawal', history: withdrawalHistory, imported: 6 }
    ])('keeps a previously imported $label when Binance later omits its status', ({ history, imported }) =>
        Effect.gen(function* () {
            expect(yield* importedCountsAfterEachStatus(history, HOUR_MS / 2, [imported, undefined])).toEqual([1, 1]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', history: depositHistory },
        { label: 'withdrawal', history: withdrawalHistory }
    ])('anchors the capital window at a $label pending for less than 180 days', ({ history }) =>
        Effect.gen(function* () {
            const pendingFrom = yield* pendingFloorAfterFirstSync(history, 100 * DAY_MS);

            expect(pendingFrom).toBeInstanceOf(Date);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { label: 'deposit', history: depositHistory },
        { label: 'withdrawal', history: withdrawalHistory }
    ])('does not anchor the capital window at a $label pending for more than 180 days', ({ history }) =>
        Effect.gen(function* () {
            expect(yield* pendingFloorAfterFirstSync(history, 200 * DAY_MS)).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('removes the ledger money of a consolidated withdrawal that Binance now reports as rejected', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const atmCashMoveService = yield* AtmCashMoveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { sync, instrument } = yield* startForwardSync();
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: instrument.id });
            const timeMs = Date.now() - HOUR_MS / 2;

            withdrawalHistory.stub(6, timeMs);
            yield* binanceSyncService.sync();
            const [withdrawal] = yield* fetchBinanceTransactions();
            const cashWithdrawalMcc = yield* testQueryService.findMccByCode('6011');
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ mccCategoryId: cashWithdrawalMcc.id })
                .where(eq(TransactionEntryEntityTable.transactionId, withdrawal.id));
            expect(yield* atmCashMoveService.moveToCash([withdrawal.id])).toEqual([withdrawal.id]);
            expect((yield* testQueryService.findTransactionById(withdrawal.id)).consolidationParentTransactionId).not.toBeNull();

            withdrawalHistory.stub(3, timeMs);
            yield* syncAgain(sync.id);

            expect(yield* fetchBinanceTransactions()).toHaveLength(0);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL)).toHaveLength(0);
            expect((yield* accountBalanceRepository.getLedgerBalances([cashAccount.id])).get(cashAccount.id) ?? 0).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
