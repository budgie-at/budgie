import { describe, expect, it } from 'vitest';

import { PRECISION, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService } from '../harness/test-context';

describe('consolidation/refund-pair-time-window-boundary', () => {
    it('auto-consolidates a refund exactly at the 30-day boundary', async () => {
        const { consolidated, expense, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS
        });

        expect(consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
    });

    it('leaves a refund outside the 30-day boundary unconsolidated', async () => {
        const { consolidated, refunds } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS + 1
        });

        expect(consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });
});
