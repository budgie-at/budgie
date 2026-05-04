import { describe, expect, it } from 'vitest';

import { PRECISION, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';

import { fetchTransactionById, seed, seedRefundedExpense } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-time-window-boundary', () => {
    it('auto-consolidates a refund exactly at the 30-day boundary', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
    });

    it('does NOT auto-consolidate a refund that arrives 1 second past the 30-day boundary', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS + 1
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });
});
