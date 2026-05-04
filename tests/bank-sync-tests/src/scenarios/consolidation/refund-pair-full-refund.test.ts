import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario } from '../../harness';

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
});
