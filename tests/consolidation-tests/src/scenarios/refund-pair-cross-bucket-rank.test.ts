import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

import type { RefundCandidateInterface, RefundReviewCandidateInterface, TransactionEntityInterface } from '@budgie/contracts';

const CROSS_BUCKET_YEAR = 2026;
const CROSS_BUCKET_REFUND_DELAY_SECONDS = 2 * 60 * 60;

const UBER_TITLE = 'UBER TRIP';
const UBER_REVERSAL_TITLE = 'Скасування. UBER TRIP';
const UBER_REFUND_AMOUNT_UAH = 340;
const UBER_REFUND_AMOUNT = UBER_REFUND_AMOUNT_UAH * PRECISION;
const UBER_SHADOW_AMOUNT_UAH = 500;
const UBER_SHADOW_AMOUNT = UBER_SHADOW_AMOUNT_UAH * PRECISION;
const UBER_SHADOW_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 5, 9, 0, 0);
const UBER_MATCHED_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 5, 18, 0, 0);

const LIME_TITLE = 'LIME RIDE';
const LIME_REVERSAL_TITLE = 'Скасування. LIME RIDE';
const LIME_REFUND_AMOUNT_UAH = 340;
const LIME_REFUND_AMOUNT = LIME_REFUND_AMOUNT_UAH * PRECISION;
const LIME_SHADOW_AMOUNT_UAH = 120;
const LIME_SHADOW_AMOUNT = LIME_SHADOW_AMOUNT_UAH * PRECISION;
const LIME_SHADOW_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 12, 9, 0, 0);
const LIME_TWIN_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 12, 10, 0, 0);
const LIME_MATCHED_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 12, 18, 0, 0);

const SPOTIFY_TITLE = 'SPOTIFY';
const SPOTIFY_REVERSAL_TITLE = 'Скасування. SPOTIFY';
const SPOTIFY_AMOUNT_UAH = 200;
const SPOTIFY_AMOUNT = SPOTIFY_AMOUNT_UAH * PRECISION;
const SPOTIFY_SHADOW_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 20, 9, 0, 0);
const SPOTIFY_MATCHED_EXPENSE_OPERATED_AT = new Date(CROSS_BUCKET_YEAR, 2, 20, 18, 0, 0);

const seedShadowedRefund = (input: {
    readonly accountId: number;
    readonly matchedAmount: number;
    readonly matchedOperatedAt: Date;
    readonly matchedTitle: string;
    readonly refundTitle: string;
    readonly shadowAmount: number;
    readonly shadowOperatedAt: Date;
    readonly shadowTitle: string;
}): {
    readonly matchedExpense: TransactionEntityInterface;
    readonly refunds: TransactionEntityInterface[];
    readonly shadowExpense: TransactionEntityInterface;
} => {
    const shadowExpense = testSeedService.refundedExpense({
        accountId: input.accountId,
        title: input.shadowTitle,
        expenseAmount: input.shadowAmount,
        refundAmounts: [],
        expenseOperatedAt: input.shadowOperatedAt,
        externalIdPrefix: 'cross-bucket-shadow'
    }).expense;
    const matched = testSeedService.refundedExpense({
        accountId: input.accountId,
        title: input.matchedTitle,
        expenseAmount: input.matchedAmount,
        refundAmounts: [input.matchedAmount],
        refundTitle: input.refundTitle,
        expenseOperatedAt: input.matchedOperatedAt,
        refundDelaySeconds: CROSS_BUCKET_REFUND_DELAY_SECONDS,
        externalIdPrefix: 'cross-bucket-matched'
    });

    return { shadowExpense, matchedExpense: matched.expense, refunds: matched.refunds };
};

const fetchRankedCandidates = async (): Promise<{
    readonly auto: RefundCandidateInterface[];
    readonly review: RefundReviewCandidateInterface[];
}> => ({ auto: await refundPairRepository.findCandidates(), review: await refundPairRepository.findReviewCandidates() });

describe('consolidation/refund-pair-cross-bucket-rank', () => {
    it('auto-consolidates the unique localized exact-amount match shadowed by an exact-title candidate of another expense', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { matchedExpense, refunds, shadowExpense } = seedShadowedRefund({
            accountId: account.id,
            shadowTitle: UBER_REVERSAL_TITLE,
            shadowAmount: UBER_SHADOW_AMOUNT,
            shadowOperatedAt: UBER_SHADOW_EXPENSE_OPERATED_AT,
            matchedTitle: UBER_TITLE,
            matchedAmount: UBER_REFUND_AMOUNT,
            matchedOperatedAt: UBER_MATCHED_EXPENSE_OPERATED_AT,
            refundTitle: UBER_REVERSAL_TITLE
        });

        const { auto, review } = await fetchRankedCandidates();

        expect(auto).toEqual([
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                expenseTransactionId: matchedExpense.id,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: UBER_REFUND_AMOUNT
            })
        ]);
        expect(review).toHaveLength(0);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(matchedExpense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(matchedExpense.id);
        expect(testQueryService.fetchTransactionById(shadowExpense.id).consolidationType).toBeNull();
    });

    it('surfaces an ambiguous localized candidate for review instead of dropping the refund behind an exact-title shadow', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        testSeedService.refundedExpense({
            accountId: account.id,
            title: LIME_TITLE,
            expenseAmount: LIME_REFUND_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: LIME_TWIN_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'lime-twin'
        });
        const { matchedExpense, refunds } = seedShadowedRefund({
            accountId: account.id,
            shadowTitle: LIME_REVERSAL_TITLE,
            shadowAmount: LIME_SHADOW_AMOUNT,
            shadowOperatedAt: LIME_SHADOW_EXPENSE_OPERATED_AT,
            matchedTitle: LIME_TITLE,
            matchedAmount: LIME_REFUND_AMOUNT,
            matchedOperatedAt: LIME_MATCHED_EXPENSE_OPERATED_AT,
            refundTitle: LIME_REVERSAL_TITLE
        });

        const { auto, review } = await fetchRankedCandidates();

        expect(auto).toHaveLength(0);
        expect(review).toEqual([
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                expenseTransactionId: matchedExpense.id,
                refundIncomeTransactionIds: [refunds[0].id],
                refundsTotal: LIME_REFUND_AMOUNT
            })
        ]);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
    });
});

describe('consolidation/refund-pair-cross-bucket-rank exact-title precedence', () => {
    it('keeps an equally exact-amount exact-title candidate ahead of a localized alternative', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { matchedExpense, refunds, shadowExpense } = seedShadowedRefund({
            accountId: account.id,
            shadowTitle: SPOTIFY_REVERSAL_TITLE,
            shadowAmount: SPOTIFY_AMOUNT,
            shadowOperatedAt: SPOTIFY_SHADOW_EXPENSE_OPERATED_AT,
            matchedTitle: SPOTIFY_TITLE,
            matchedAmount: SPOTIFY_AMOUNT,
            matchedOperatedAt: SPOTIFY_MATCHED_EXPENSE_OPERATED_AT,
            refundTitle: SPOTIFY_TITLE
        });

        const { auto, review } = await fetchRankedCandidates();

        expect(auto).toHaveLength(0);
        expect(review).toEqual([
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_EXACT_TITLE',
                expenseTransactionId: matchedExpense.id,
                refundIncomeTransactionIds: [refunds[0].id]
            })
        ]);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(shadowExpense.id).consolidationType).toBeNull();
    });
});
