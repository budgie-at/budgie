import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const SEEZONA_EXPENSE_AMOUNT_UAH = 103.2;
const SEEZONA_EXPENSE_AMOUNT = SEEZONA_EXPENSE_AMOUNT_UAH * PRECISION;
const SEEZONA_REFUND_AMOUNT_UAH = 102;
const SEEZONA_REFUND_AMOUNT = SEEZONA_REFUND_AMOUNT_UAH * PRECISION;
const STARBUCKS_EXPENSE_AMOUNT_UAH = 120;
const STARBUCKS_EXPENSE_AMOUNT = STARBUCKS_EXPENSE_AMOUNT_UAH * PRECISION;
const LIME_EXPENSE_AMOUNT_UAH = 898;
const LIME_EXPENSE_AMOUNT = LIME_EXPENSE_AMOUNT_UAH * PRECISION;
const LIME_REFUND_YEAR = 2026;
const FIRST_LIME_EXPENSE_OPERATED_AT = new Date(LIME_REFUND_YEAR, 0, 15, 12, 0, 0);
const SECOND_LIME_EXPENSE_OPERATED_AT = new Date(LIME_REFUND_YEAR, 0, 16, 12, 0, 0);

const seedSeezonaRefund = (accountId: number, refundAccountId?: number) => {
    const mcc = testQueryService.findMccByCode('5621');

    return testSeedService.refundedExpense({
        accountId,
        ...(isDefined(refundAccountId) && { refundAccountId }),
        expenseAmount: SEEZONA_EXPENSE_AMOUNT,
        refundAmounts: [SEEZONA_REFUND_AMOUNT],
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
            expenseAmount: STARBUCKS_EXPENSE_AMOUNT,
            refundAmounts: [STARBUCKS_EXPENSE_AMOUNT],
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
            expenseAmount: STARBUCKS_EXPENSE_AMOUNT,
            refundAmounts: [STARBUCKS_EXPENSE_AMOUNT],
            title: 'STARBUCKS #1234',
            refundTitle: 'REFUND',
            mccCategoryId: mcc.id,
            refundMccCategoryId: mcc.id
        });

        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(reviewCandidates).toHaveLength(0);
    });

    it('surfaces a gated-out localized-refund-title candidate for manual review when multiple expenses compete', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: LIME_EXPENSE_AMOUNT,
            refundAmounts: [],
            title: 'Lime',
            externalIdPrefix: 'first',
            expenseOperatedAt: FIRST_LIME_EXPENSE_OPERATED_AT
        });
        const { expense: secondExpense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: LIME_EXPENSE_AMOUNT,
            refundAmounts: [LIME_EXPENSE_AMOUNT],
            title: 'Lime',
            refundTitle: 'Скасування. Lime',
            externalIdPrefix: 'second',
            expenseOperatedAt: SECOND_LIME_EXPENSE_OPERATED_AT,
            refundDelaySeconds: 24 * 60 * 60
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(autoCandidates).toHaveLength(0);
        expect(reviewCandidates).toEqual([
            {
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                matchType: 'localized-refund-title',
                accountId: account.id,
                expenseTransactionId: secondExpense.id,
                expenseEntryAmount: LIME_EXPENSE_AMOUNT,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: LIME_EXPENSE_AMOUNT
            }
        ]);
    });
});
