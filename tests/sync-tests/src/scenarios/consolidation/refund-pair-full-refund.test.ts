import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import {
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    fetchAccountBalance,
    fetchExpenseEntries,
    fetchTransactionById,
    runRefundScenario,
    seedRefundStatisticsScenario,
    TestLayer
} from '../../harness';

describe('consolidation/refund-pair-full-refund', () => {
    it.effect('promotes the expense and reparents the matching-amount refund (full refund)', () =>
        Effect.gen(function* () {
            const { expense, refunds, result } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION]
            });

            expect(result.consolidated).toBe(1);

            const promotedExpense = yield* fetchTransactionById(expense.id);
            expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
            expect((yield* fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBe(expense.id);

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
            const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;

            expect([totals?.income, totals?.expense, categoryAmount]).toStrictEqual([0, 0, 0]);
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
