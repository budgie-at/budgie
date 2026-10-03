import { computeRefundedSummary } from '@app/transaction/utils/compute-refunded-summary.util';
import {
    AccountBalanceRepository,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionViewRepository
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario, seedRefundStatisticsScenario, TestLayer } from '../../harness';
import { seed } from '../../harness/seed/seed';

const REFUNDED_EXPENSE_AMOUNT = Number('120') * PRECISION;
const PARTIAL_REFUND_AMOUNT = 40 * PRECISION;
const PARTIAL_REFUNDED_EXPENSE_AMOUNT = 80 * PRECISION;

describe('consolidation/refund-pair-partial', () => {
    it.effect('moves the partial refund DEBIT entry onto the expense canonical', () =>
        Effect.gen(function* () {
            const { expense, refunds, result } = yield* runRefundScenario({
                expenseAmount: REFUNDED_EXPENSE_AMOUNT,
                refundAmounts: [PARTIAL_REFUND_AMOUNT]
            });

            expect(result.consolidated).toBe(1);

            const promotedExpense = yield* fetchTransactionById(expense.id);
            expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

            const expenseEntries = yield* fetchExpenseEntries(expense.id);
            const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
            const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

            expect(credits).toHaveLength(1);
            expect(credits[0].amount).toBe(REFUNDED_EXPENSE_AMOUNT);
            expect(debits).toHaveLength(1);
            expect(debits[0].amount).toBe(PARTIAL_REFUND_AMOUNT);
            expect(debits[0].originalTransactionId).toBe(refunds[0].id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nets partial refunds out of totals and expense category analytics', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const statisticsRepository = yield* StatisticsRepository;
            const { account, category, expense } = yield* seedRefundStatisticsScenario(PARTIAL_REFUND_AMOUNT);
            const tag = yield* seed.tag('Refunded');
            yield* seed.transactionTag(expense.id, tag.id);

            yield* transferConsolidationService.consolidate(null);

            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId);
            expect(totals?.income).toBe(0);
            expect(totals?.expense).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);

            const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                account.instrumentId,
                LanguageEnum.EN
            );
            expect(categoryRows.find(row => row.category?.id === category.id)?.amount).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);

            const tagRows = yield* statisticsRepository.getExpenseByTagQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId);
            expect(tagRows.find(row => row.tag?.id === tag.id)?.amount).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps moved refund income entries in account balance calculations', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { account } = yield* runRefundScenario({
                expenseAmount: REFUNDED_EXPENSE_AMOUNT,
                refundAmounts: [PARTIAL_REFUND_AMOUNT]
            });

            const [balance] = yield* accountBalanceRepository.getByAccountId(account.id);

            expect(balance?.balance).toBe(-PARTIAL_REFUNDED_EXPENSE_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('computes refunded summary from an explicit refund total when moved entries are hidden', () =>
        Effect.gen(function* () {
            const transactionViewRepository = yield* TransactionViewRepository;
            const { expense } = yield* runRefundScenario({
                expenseAmount: REFUNDED_EXPENSE_AMOUNT,
                refundAmounts: [PARTIAL_REFUND_AMOUNT]
            });

            const promotedExpense = yield* transactionViewRepository.getById(expense.id, LanguageEnum.EN);

            if (!promotedExpense) {
                throw new Error('Promoted expense not found');
            }

            const summary = computeRefundedSummary(promotedExpense, PARTIAL_REFUND_AMOUNT);

            expect(summary?.refundsTotal).toBe(PARTIAL_REFUND_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
