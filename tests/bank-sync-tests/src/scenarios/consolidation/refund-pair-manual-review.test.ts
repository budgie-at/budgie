import { describe, expect, it } from 'vitest';

import { PRECISION } from '@budgie/contracts';

import { fetchTransactionById, findMccByCode, seed, seedRefundedExpense } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-manual-review', () => {
    it('counts a prefix-stripped + same-MCC pair in manualReviewCandidateCount but does not auto-consolidate it', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const mcc = findMccByCode('5814');
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'REFUND STARBUCKS #1234',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id
        });

        const preview = await transferConsolidationService.preview();
        expect(preview.autoCandidateCount).toBe(0);
        expect(preview.manualReviewCandidateCount).toBeGreaterThanOrEqual(1);

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(0);
        expect(fetchTransactionById(expense.id).consolidationType).toBeNull();
        expect(fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });
});
