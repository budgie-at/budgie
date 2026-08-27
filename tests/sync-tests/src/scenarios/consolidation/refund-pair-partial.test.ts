import { accountBalanceRepository, statisticsRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { computeRefundedSummary } from '@app/transaction/utils/compute-refunded-summary.util';
import {
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario, seedRefundStatisticsScenario } from '../../harness';
import { seed } from '../../harness/seed/seed';

const REFUNDED_EXPENSE_AMOUNT = Number('120') * PRECISION;
const PARTIAL_REFUND_AMOUNT = 40 * PRECISION;
const PARTIAL_REFUNDED_EXPENSE_AMOUNT = 80 * PRECISION;

describe('consolidation/refund-pair-partial', () => {
    it('moves the partial refund DEBIT entry onto the expense canonical', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: REFUNDED_EXPENSE_AMOUNT,
            refundAmounts: [PARTIAL_REFUND_AMOUNT]
        });

        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const expenseEntries = await fetchExpenseEntries(expense.id);
        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

        expect(credits).toHaveLength(1);
        expect(credits[0].amount).toBe(REFUNDED_EXPENSE_AMOUNT);
        expect(debits).toHaveLength(1);
        expect(debits[0].amount).toBe(PARTIAL_REFUND_AMOUNT);
        expect(debits[0].originalTransactionId).toBe(refunds[0].id);
    });

    it('nets partial refunds out of totals and expense category analytics', async () => {
        const { account, category, expense } = seedRefundStatisticsScenario(PARTIAL_REFUND_AMOUNT);
        const tag = seed.tag('Refunded');
        seed.transactionTag(expense.id, tag.id);

        await transferConsolidationService.consolidate();

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).get();
        expect(totals?.income).toBe(0);
        expect(totals?.expense).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);

        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId, LanguageEnum.EN)
            .all();
        expect(categoryRows.find(row => row.category?.id === category.id)?.amount).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);

        const tagRows = statisticsRepository.getExpenseByTagQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).all();
        expect(tagRows.find(row => row.tag?.id === tag.id)?.amount).toBe(PARTIAL_REFUNDED_EXPENSE_AMOUNT);
    });

    it('keeps moved refund income entries in account balance calculations', async () => {
        const { account } = await runRefundScenario({
            expenseAmount: REFUNDED_EXPENSE_AMOUNT,
            refundAmounts: [PARTIAL_REFUND_AMOUNT]
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-PARTIAL_REFUNDED_EXPENSE_AMOUNT);
    });

    it('computes refunded summary from an explicit refund total when moved entries are hidden', async () => {
        const { expense } = await runRefundScenario({
            expenseAmount: REFUNDED_EXPENSE_AMOUNT,
            refundAmounts: [PARTIAL_REFUND_AMOUNT]
        });

        const promotedExpense = await transactionRepository.getById(expense.id, LanguageEnum.EN);

        if (!promotedExpense) {
            throw new Error('Promoted expense not found');
        }

        const summary = computeRefundedSummary(promotedExpense, PARTIAL_REFUND_AMOUNT);

        expect(summary?.refundsTotal).toBe(PARTIAL_REFUND_AMOUNT);
    });
});
