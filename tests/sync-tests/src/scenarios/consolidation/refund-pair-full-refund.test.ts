import {
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    fetchAccountBalance,
    fetchExpenseEntries,
    runRefundScenario,
    seedRefundStatisticsScenario,
    TestLayer,
    testQueryService
} from '../../harness';

describe('consolidation/refund-pair-full-refund', () => {
    it.effect('promotes the expense and reparents the matching-amount refund (full refund)', () =>
        Effect.gen(function* () {
            const { expense, refunds, result } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(result.consolidated).toBe(1);

            const promotedExpense = yield* testQueryService.findTransactionById(expense.id);
            expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect((yield* testQueryService.findTransactionById(refunds[0].id)).consolidationParentTransactionId).toBe(expense.id);

            const expenseEntries = yield* fetchExpenseEntries(expense.id);
            const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
            const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
            const creditTotal = credits.reduce((sum, entry) => sum + entry.amount, 0);
            const debitTotal = debits.reduce((sum, entry) => sum + entry.amount, 0);

            expect(creditTotal - debitTotal).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('removes full refunds from totals and expense category analytics', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const statisticsRepository = yield* StatisticsRepository;
            const { account, category } = yield* seedRefundStatisticsScenario(120 * PRECISION);

            yield* transferConsolidationService.consolidate(null);

            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId)).at(
                0
            );
            const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                account.instrumentId,
                LanguageEnum.EN
            );
            const categoryRow = categoryRows.find(row => row.category?.id === category.id);

            expect([totals?.income, totals?.expense, categoryRow]).toStrictEqual([0, 0, undefined]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a fully refunded purchase as statistics history although its totals net to zero', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const statisticsRepository = yield* StatisticsRepository;
            const allTime = { ...DEFAULT_TRANSACTION_FILTER, date: null };
            const emptyLedger = yield* statisticsRepository.hasIncomeOrExpenseQuery(allTime);
            const { account } = yield* seedRefundStatisticsScenario(120 * PRECISION);

            yield* transferConsolidationService.consolidate(null);

            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(allTime, account.instrumentId);

            expect([emptyLedger, totals.income, totals.expense]).toStrictEqual([[], 0, 0]);
            expect(yield* statisticsRepository.hasIncomeOrExpenseQuery(allTime)).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports refunds netted against purchases in or before the period', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const statisticsRepository = yield* StatisticsRepository;
            const { account, category, expense } = yield* seedRefundStatisticsScenario(120 * PRECISION);

            yield* transferConsolidationService.consolidate(null);

            const categoryFilter = { ...DEFAULT_TRANSACTION_FILTER, categoryIds: [category.id] };
            const refundOnlyPeriod = { from: new Date(2026, 0, 16), to: new Date(2026, 0, 31, 23, 59, 59) };
            const purchaseOnlyPeriod = { from: new Date(2026, 0, 1), to: new Date(2026, 0, 15, 23, 59, 59) };
            const laterPeriod = { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28, 23, 59, 59) };
            const [refundOnly] = yield* statisticsRepository.getNettedRefundsQuery(
                { ...categoryFilter, date: refundOnlyPeriod },
                account.instrumentId
            );
            const [purchaseOnly] = yield* statisticsRepository.getNettedRefundsQuery(
                { ...categoryFilter, date: purchaseOnlyPeriod },
                account.instrumentId
            );
            const [later] = yield* statisticsRepository.getNettedRefundsQuery(
                { ...categoryFilter, date: laterPeriod },
                account.instrumentId
            );
            const netted = { amount: 120 * PRECISION, purchasedAt: Math.floor(expense.operatedAt.getTime() / 1000) };

            expect([refundOnly, purchaseOnly, later]).toStrictEqual([netted, netted, { amount: 0, purchasedAt: null }]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps full refunds neutral in account balance calculations', () =>
        Effect.gen(function* () {
            const { account } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(yield* fetchAccountBalance(account.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
