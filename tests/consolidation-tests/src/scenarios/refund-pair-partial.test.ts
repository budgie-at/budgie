import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService } from '../harness/test-context';

describe('consolidation/refund-pair-partial', () => {
    it('moves the partial refund debit entry onto the expense canonical', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const expenseEntries = testQueryService.fetchEntriesByTransactionId(expense.id);
        const credits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debits = expenseEntries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

        expect(credits).toHaveLength(1);
        expect(credits[0].amount).toBe(120 * PRECISION);
        expect(debits).toHaveLength(1);
        expect(debits[0].amount).toBe(40 * PRECISION);
        expect(debits[0].originalTransactionId).toBe(refunds[0].id);
    });
});
