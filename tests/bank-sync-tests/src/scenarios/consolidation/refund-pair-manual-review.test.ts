import { describe, expect, it } from 'vitest';

import { PRECISION } from '@budgie/contracts';

import { fetchTransactionById, findMccByCode, seed, seedRefundedExpense } from '../../harness';

import { refundPairRepository } from '@app/@generic/drizzle/db/db';
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

    it('recommends a localized cancellation with a location suffix for manual review', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const mcc = findMccByCode('5621');
        const { refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 103.2 * PRECISION,
            refundAmounts: [102 * PRECISION],
            title: 'Seezona',
            refundTitle: 'Скасування. Seezona,Stockholm,SE',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id,
            refundDelaySeconds: 50 * 24 * 60 * 60
        });

        const preview = await transferConsolidationService.preview();
        const manualCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');

        expect(preview.autoCandidateCount).toBe(0);
        expect(preview.manualReviewCandidateCount).toBeGreaterThanOrEqual(1);
        expect(manualCandidates).toMatchObject([{ title: 'Seezona', isRecommended: true }]);
    });

    it('recommends same-currency refunds from another account for manual review', async () => {
        const expenseAccount = seed.account({ title: 'Expense Card', externalId: 'mono-expense-card' });
        const refundAccount = seed.account({ title: 'Refund Card', externalId: 'mono-refund-card' });
        const mcc = findMccByCode('5621');
        const { refunds } = seedRefundedExpense({
            accountId: expenseAccount.id,
            refundAccountId: refundAccount.id,
            expenseAmount: 103.2 * PRECISION,
            refundAmounts: [102 * PRECISION],
            title: 'Seezona',
            refundTitle: 'Скасування. Seezona,Stockholm,SE',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id,
            refundDelaySeconds: 50 * 24 * 60 * 60
        });

        const preview = await transferConsolidationService.preview();
        const manualCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');

        expect(preview.autoCandidateCount).toBe(0);
        expect(preview.manualReviewCandidateCount).toBeGreaterThanOrEqual(1);
        expect(manualCandidates).toMatchObject([{ title: 'Seezona', accountTitle: 'Expense Card', isRecommended: true }]);
    });

    it('does not treat prefix-only refund titles as broad manual-review matches', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const mcc = findMccByCode('5814');

        seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'REFUND',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id
        });

        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(reviewCandidates).toHaveLength(0);
    });
});
