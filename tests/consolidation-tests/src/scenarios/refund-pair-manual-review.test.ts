import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const seedSeezonaRefund = (accountId: number, refundAccountId?: number) => {
    const mcc = testQueryService.findMccByCode('5621');

    return testSeedService.refundedExpense({
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
    const autoCandidates = await refundPairRepository.findCandidates();
    const reviewCandidates = await refundPairRepository.findReviewCandidates();
    const manualCandidates = await refundPairRepository.findRefundableExpenseCandidates(refundId, '');

    expect(autoCandidates).toHaveLength(0);
    expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);
    expect(manualCandidates).toMatchObject([
        {
            title: 'Seezona',
            ...(isDefined(accountTitle) && { accountTitle }),
            isRecommended: true
        }
    ]);
};

describe('consolidation/refund-pair-manual-review', () => {
    it('counts a prefix-stripped + same-MCC pair for manual review but does not auto-consolidate it', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const mcc = testQueryService.findMccByCode('5814');
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION],
            title: 'STARBUCKS #1234',
            refundTitle: 'REFUND STARBUCKS #1234',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();
        expect(autoCandidates).toHaveLength(0);
        expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);

        const result = await runConsolidation();
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });

    it('recommends a localized cancellation with a location suffix for manual review', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { refunds } = seedSeezonaRefund(account.id);

        await expectManualSeezonaCandidate(refunds[0].id);
    });

    it('recommends same-currency refunds from another account for manual review', async () => {
        const expenseAccount = testSeedService.account({ title: 'Expense Card', externalId: 'mono-expense-card' });
        const refundAccount = testSeedService.account({ title: 'Refund Card', externalId: 'mono-refund-card' });
        const { refunds } = seedSeezonaRefund(expenseAccount.id, refundAccount.id);

        await expectManualSeezonaCandidate(refunds[0].id, 'Expense Card');
    });

    it('does not treat prefix-only refund titles as broad manual-review matches', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const mcc = testQueryService.findMccByCode('5814');

        testSeedService.refundedExpense({
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
