import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario } from '../../harness';

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
});
