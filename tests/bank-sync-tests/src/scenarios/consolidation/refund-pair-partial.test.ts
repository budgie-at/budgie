import { describe, expect, it } from 'vitest';

import {
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { computeRefundedSummary } from '@app/transaction/utils/compute-refunded-summary.util';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario, seedRefundStatisticsScenario } from '../../harness';

import { accountBalanceRepository, statisticsRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-partial', () => {
    it('moves the partial refund DEBIT entry onto the expense canonical', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const expenseEntries = await fetchExpenseEntries(expense.id);
        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

        expect(credits).toHaveLength(1);
        expect(credits[0].amount).toBe(120 * PRECISION);
        expect(debits).toHaveLength(1);
        expect(debits[0].amount).toBe(40 * PRECISION);
        expect(debits[0].originalTransactionId).toBe(refunds[0].id);
    });

    it('nets partial refunds out of totals and expense category analytics', async () => {
        const { account, category } = seedRefundStatisticsScenario(40 * PRECISION);

        await transferConsolidationService.consolidate();

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).get();
        expect(totals?.income).toBe(0);
        expect(totals?.expense).toBe(80 * PRECISION);

        const categoryRows = statisticsRepository
            .getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId, LanguageEnum.EN)
            .all();
        const categoryRow = categoryRows.find(row => row.category?.id === category.id);
        expect(categoryRow?.amount).toBe(80 * PRECISION);
    });

    it('keeps moved refund income entries in account balance calculations', async () => {
        const { account } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(-80 * PRECISION);
    });

    it('computes refunded summary from an explicit refund total when moved entries are hidden', async () => {
        const { expense } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        const promotedExpense = await transactionRepository.getById(expense.id);

        if (!promotedExpense) {
            throw new Error('Promoted expense not found');
        }

        const summary = computeRefundedSummary(promotedExpense, 40 * PRECISION);

        expect(summary?.refundsTotal).toBe(40 * PRECISION);
    });
});
