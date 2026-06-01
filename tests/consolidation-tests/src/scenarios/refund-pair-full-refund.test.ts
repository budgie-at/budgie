import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService } from '../harness/test-context';

describe('consolidation/refund-pair-full-refund', () => {
    it('promotes the expense and keeps a full refund neutral on the canonical ledger', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        expect(consolidated).toBe(1);

        const promotedExpense = testQueryService.fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);

        const expenseEntries = testQueryService.fetchEntriesByTransactionId(expense.id);
        const creditTotal = expenseEntries
            .filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT)
            .reduce((sum, entry) => sum + entry.amount, 0);
        const debitTotal = expenseEntries
            .filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
            .reduce((sum, entry) => sum + entry.amount, 0);

        expect(creditTotal - debitTotal).toBe(0);
    });
});
