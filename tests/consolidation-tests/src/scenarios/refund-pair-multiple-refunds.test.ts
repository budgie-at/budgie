import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService } from '../harness/test-context';

describe('consolidation/refund-pair-multiple-refunds', () => {
    it('reparents multiple refund incomes under one promoted expense canonical', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION, 30 * PRECISION]
        });

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        for (const refund of refunds) {
            expect(testQueryService.fetchTransactionById(refund.id).consolidationParentTransactionId).toBe(expense.id);
        }

        const entries = testQueryService.fetchEntriesByTransactionId(expense.id);
        const debits = entries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        expect(debits).toHaveLength(2);
        expect(debits.map(entry => entry.amount).sort((left, right) => left - right)).toEqual([30 * PRECISION, 40 * PRECISION]);
    });
});
