import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchTransactionById, seed, seedRefundedExpense } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-by-title', () => {
    it('promotes the original expense in place when title matches exactly within 30 days', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);

        const promotedExpense = fetchTransactionById(expense.id);
        expect(promotedExpense.consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(promotedExpense.consolidationParentTransactionId).toBeNull();

        const reparentedRefund = fetchTransactionById(refunds[0].id);
        expect(reparentedRefund.consolidationParentTransactionId).toBe(expense.id);
    });

    it('does NOT consolidate when titles differ', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'WALMART #5678'
        });

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
    });
});
