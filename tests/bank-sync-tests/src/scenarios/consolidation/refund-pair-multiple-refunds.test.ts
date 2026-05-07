import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { fetchExpenseEntries, fetchTransactionById, runRefundScenario } from '../../harness';

describe('consolidation/refund-pair-multiple-refunds', () => {
    it('reparents N refund incomes under one expense canonical (1:N)', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION, 30 * PRECISION]
        });

        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        for (const refund of refunds) {
            expect(fetchTransactionById(refund.id).consolidationParentTransactionId).toBe(expense.id);
        }

        const expenseEntries = await fetchExpenseEntries(expense.id);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        expect(debits).toHaveLength(2);
        expect(debits.map(entry => entry.amount).sort((a, b) => a - b)).toEqual([30 * PRECISION, 40 * PRECISION]);
    });
});
