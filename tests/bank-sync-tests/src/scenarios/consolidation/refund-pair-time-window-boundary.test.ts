import { describe, expect, it } from 'vitest';

import { PRECISION, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';

import { fetchTransactionById, runRefundScenario } from '../../harness';

describe('consolidation/refund-pair-time-window-boundary', () => {
    it('auto-consolidates a refund exactly at the 30-day boundary', async () => {
        const { expense, refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS
        });

        expect(result.consolidated).toBe(1);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
    });

    it('does NOT auto-consolidate a refund that arrives 1 second past the 30-day boundary', async () => {
        const { refunds, result } = await runRefundScenario({
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS + 1
        });

        expect(result.consolidated).toBe(0);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });
});
