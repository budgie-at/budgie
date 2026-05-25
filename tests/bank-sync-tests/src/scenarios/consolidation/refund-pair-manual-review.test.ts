import { describe, expect, it } from 'vitest';

import { PRECISION } from '@budgie/contracts';
import { isDefined } from '@rnw-community/shared';

import { fetchTransactionById, findMccByCode, seed, seedRefundedExpense } from '../../harness';

import { refundPairRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const seedSeezonaRefund = (accountId: number, refundAccountId?: number) => {
    const mcc = findMccByCode('5621');

    return seedRefundedExpense({
        accountId,
        ...(isDefined(refundAccountId) && { refundAccountId }),
        expenseAmount: 103.2 * PRECISION,
        refundAmounts: [102 * PRECISION],
        title: 'Seezona',
        refundTitle: 'Скасування. Seezona,Stockholm,SE',
        mccCategoryId: mcc.id,
        refundMccCategoryId: mcc.id,
        refundDelaySeconds: 50 * 24 * 60 * 60
    });
};

const expectManualSeezonaCandidate = async (refundId: number, accountTitle?: string) => {
    const preview = await transferConsolidationService.preview();
    const manualCandidates = await refundPairRepository.findRefundableExpenseCandidates(refundId, '');

    expect(preview.autoCandidateCount).toBe(0);
    expect(preview.manualReviewCandidateCount).toBeGreaterThanOrEqual(1);
    expect(manualCandidates).toMatchObject([
        {
            title: 'Seezona',
            ...(isDefined(accountTitle) && { accountTitle }),
            isRecommended: true
        }
    ]);
};

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
        const { refunds } = seedSeezonaRefund(account.id);

        await expectManualSeezonaCandidate(refunds[0].id);
    });

    it('recommends same-currency refunds from another account for manual review', async () => {
        const expenseAccount = seed.account({ title: 'Expense Card', externalId: 'mono-expense-card' });
        const refundAccount = seed.account({ title: 'Refund Card', externalId: 'mono-refund-card' });
        const { refunds } = seedSeezonaRefund(expenseAccount.id, refundAccount.id);

        await expectManualSeezonaCandidate(refunds[0].id, 'Expense Card');
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
