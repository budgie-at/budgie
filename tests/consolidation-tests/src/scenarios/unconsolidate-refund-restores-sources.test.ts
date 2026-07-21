import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

describe('consolidation/unconsolidate-refund-restores-sources', () => {
    it('restores the refund as a standalone income and clears consolidation type on the expense', async () => {
        const { expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [40 * PRECISION]
        });

        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        await unconsolidationService.unconsolidateById(expense.id, testDb);

        const restoredExpense = testQueryService.fetchTransactionById(expense.id);
        expect(restoredExpense.consolidationType).toBeNull();

        const restoredRefund = testQueryService.fetchTransactionById(refunds[0].id);
        expect(restoredRefund.consolidationParentTransactionId).toBeNull();
    });
});
