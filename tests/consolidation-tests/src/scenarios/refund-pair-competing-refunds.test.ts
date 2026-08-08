import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { REJECTED_PAYMENT_PRINCIPAL_TITLE } from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

import type { RefundCandidateBaseInterface, RefundCandidateInterface, TransactionEntityInterface } from '@budgie/contracts';

const COMPETING_YEAR = 2026;

const GLOVO_TITLE = 'GLOVO';
const GLOVO_AMOUNT_UAH = 500;
const GLOVO_AMOUNT = GLOVO_AMOUNT_UAH * PRECISION;
const GLOVO_EXPENSE_OPERATED_AT = new Date(COMPETING_YEAR, 2, 10, 9, 0, 0);
const GLOVO_REFUND_DELAY_SECONDS = 2 * 60 * 60;

const STARBUCKS_TITLE = 'STARBUCKS #1234';
const STARBUCKS_EXPENSE_AMOUNT_UAH = 120;
const STARBUCKS_EXPENSE_AMOUNT = STARBUCKS_EXPENSE_AMOUNT_UAH * PRECISION;
const STARBUCKS_FIRST_REFUND_AMOUNT_UAH = 40;
const STARBUCKS_FIRST_REFUND_AMOUNT = STARBUCKS_FIRST_REFUND_AMOUNT_UAH * PRECISION;
const STARBUCKS_SECOND_REFUND_AMOUNT_UAH = 30;
const STARBUCKS_SECOND_REFUND_AMOUNT = STARBUCKS_SECOND_REFUND_AMOUNT_UAH * PRECISION;
const STARBUCKS_OVERFLOW_REFUND_AMOUNT_UAH = 60;
const STARBUCKS_OVERFLOW_REFUND_AMOUNT = STARBUCKS_OVERFLOW_REFUND_AMOUNT_UAH * PRECISION;
const STARBUCKS_EXPENSE_OPERATED_AT = new Date(COMPETING_YEAR, 3, 4, 8, 0, 0);
const STARBUCKS_REFUND_DELAY_SECONDS = 3 * 60 * 60;

const NETFLIX_TITLE = 'Netflix';
const NETFLIX_TARGET_AMOUNT_UAH = 50;
const NETFLIX_TARGET_AMOUNT = NETFLIX_TARGET_AMOUNT_UAH * PRECISION;
const NETFLIX_DECOY_AMOUNT_UAH = 77;
const NETFLIX_DECOY_AMOUNT = NETFLIX_DECOY_AMOUNT_UAH * PRECISION;
const NETFLIX_DECOY_EXPENSE_OPERATED_AT = new Date(COMPETING_YEAR, 4, 6, 8, 0, 0);
const NETFLIX_TARGET_EXPENSE_OPERATED_AT = new Date(COMPETING_YEAR, 4, 6, 18, 0, 0);
const NETFLIX_REFUND_DELAY_SECONDS = 2 * 60 * 60;

const seedExactTitleRefunds = async (input: {
    readonly expenseAmount: number;
    readonly expenseOperatedAt: Date;
    readonly externalIdPrefix: string;
    readonly refundAmounts: readonly number[];
    readonly refundDelaySeconds: number;
    readonly title: string;
}): Promise<{
    readonly autoCandidates: RefundCandidateInterface[];
    readonly expense: TransactionEntityInterface;
    readonly refunds: TransactionEntityInterface[];
    readonly reviewCandidates: RefundCandidateBaseInterface[];
}> => {
    const account = testSeedService.account({ externalId: 'mono-card' });
    const { expense, refunds } = testSeedService.refundedExpense({ ...input, accountId: account.id });

    return {
        expense,
        refunds,
        autoCandidates: await refundPairRepository.findCandidates(),
        reviewCandidates: await refundPairRepository.findReviewCandidates()
    };
};

const expectSoleGroup = (candidates: readonly RefundCandidateBaseInterface[], expected: Partial<RefundCandidateInterface>): void => {
    expect(candidates).toEqual([expect.objectContaining(expected)]);
};

describe('consolidation/refund-pair-competing-refunds', () => {
    it('auto-consolidates the mutual-best refund and surfaces the over-ceiling loser for review', async () => {
        const { autoCandidates, expense, refunds, reviewCandidates } = await seedExactTitleRefunds({
            title: GLOVO_TITLE,
            expenseAmount: GLOVO_AMOUNT,
            refundAmounts: [GLOVO_AMOUNT, GLOVO_AMOUNT],
            expenseOperatedAt: GLOVO_EXPENSE_OPERATED_AT,
            refundDelaySeconds: GLOVO_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'glovo'
        });

        expectSoleGroup(autoCandidates, {
            confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
            expenseTransactionId: expense.id,
            refundIncomeTransactionIds: [refunds[0].id],
            refundsTotal: GLOVO_AMOUNT
        });
        expectSoleGroup(reviewCandidates, {
            confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
            expenseTransactionId: expense.id,
            refundIncomeTransactionIds: [refunds[1].id],
            refundsTotal: GLOVO_AMOUNT
        });

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(refunds[1].id).consolidationParentTransactionId).toBeNull();
    });

    it('keeps absorbing unambiguous partial refunds up to the expense ceiling and reviews only the overflow', async () => {
        const { autoCandidates, expense, refunds, reviewCandidates } = await seedExactTitleRefunds({
            title: STARBUCKS_TITLE,
            expenseAmount: STARBUCKS_EXPENSE_AMOUNT,
            refundAmounts: [STARBUCKS_FIRST_REFUND_AMOUNT, STARBUCKS_SECOND_REFUND_AMOUNT, STARBUCKS_OVERFLOW_REFUND_AMOUNT],
            expenseOperatedAt: STARBUCKS_EXPENSE_OPERATED_AT,
            refundDelaySeconds: STARBUCKS_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'starbucks'
        });

        expectSoleGroup(autoCandidates, {
            expenseTransactionId: expense.id,
            refundIncomeTransactionIds: [refunds[0].id, refunds[1].id],
            refundsTotal: STARBUCKS_FIRST_REFUND_AMOUNT + STARBUCKS_SECOND_REFUND_AMOUNT
        });
        expectSoleGroup(reviewCandidates, {
            expenseTransactionId: expense.id,
            refundIncomeTransactionIds: [refunds[2].id],
            refundsTotal: STARBUCKS_OVERFLOW_REFUND_AMOUNT
        });

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(refunds[1].id).consolidationParentTransactionId).toBe(expense.id);
        expect(testQueryService.fetchTransactionById(refunds[2].id).consolidationParentTransactionId).toBeNull();
    });
});

describe('consolidation/refund-pair-competing-refunds rejected best match', () => {
    it('does not auto-consolidate a worse-ranked sole-candidate refund when the expense best match is rejected', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });

        testSeedService.refundedExpense({
            accountId: account.id,
            title: NETFLIX_TITLE,
            expenseAmount: NETFLIX_DECOY_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: NETFLIX_DECOY_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'netflix-decoy'
        });
        const { expense: targetExpense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: NETFLIX_TITLE,
            expenseAmount: NETFLIX_TARGET_AMOUNT,
            refundAmounts: [NETFLIX_TARGET_AMOUNT, NETFLIX_TARGET_AMOUNT],
            refundTitles: [NETFLIX_TITLE, REJECTED_PAYMENT_PRINCIPAL_TITLE],
            expenseOperatedAt: NETFLIX_TARGET_EXPENSE_OPERATED_AT,
            refundDelaySeconds: NETFLIX_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'netflix-target'
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(autoCandidates).toHaveLength(0);
        expect(reviewCandidates).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                    expenseTransactionId: targetExpense.id,
                    refundIncomeTransactionIds: [refunds[0].id]
                }),
                expect.objectContaining({
                    confidenceBucket: 'AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE',
                    expenseTransactionId: targetExpense.id,
                    refundIncomeTransactionIds: [refunds[1].id]
                })
            ])
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(targetExpense.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(refunds[1].id).consolidationParentTransactionId).toBeNull();
    });
});
