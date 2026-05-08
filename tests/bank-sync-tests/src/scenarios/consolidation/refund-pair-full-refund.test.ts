import { describe, expect, it } from 'vitest';

import { DEFAULT_TRANSACTION_FILTER, PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario, seedRefundStatisticsScenario } from '../../harness';

import { accountBalanceRepository, statisticsRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-full-refund', () => {
    it('promotes the expense and reparents the matching-amount refund (full refund)', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

        const expenseEntries = await fetchExpenseEntries(expense.id);
        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        const creditTotal = credits.reduce((sum, entry) => sum + entry.amount, 0);
        const debitTotal = debits.reduce((sum, entry) => sum + entry.amount, 0);

        expect(creditTotal - debitTotal).toBe(0);
    });

    it('removes full refunds from totals and expense category analytics', async () => {
        const { account, category } = seedRefundStatisticsScenario(120 * PRECISION);

        await transferConsolidationService.consolidate();

        const totals = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).get();
        const categoryRows = statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId).all();
        const categoryAmount = categoryRows.find(row => row.category?.id === category.id)?.amount;

        expect([totals?.income, totals?.expense, categoryAmount]).toStrictEqual([0, 0, 0]);
    });

    it('keeps full refunds neutral in account balance calculations', async () => {
        const { account } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();

        expect(balance?.balance).toBe(0);
    });
});
