import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const AMAZON_TITLE = 'Amazon';
const AMAZON_REFUND_TITLE = 'Скасування. Amazon';
const AMAZON_EXACT_AMOUNT_UAH = 1_513.63;
const AMAZON_EXACT_AMOUNT = AMAZON_EXACT_AMOUNT_UAH * PRECISION;
const AMAZON_CLOSE_AMOUNT_UAH = 899;
const AMAZON_CLOSE_AMOUNT = AMAZON_CLOSE_AMOUNT_UAH * PRECISION;
const AMAZON_MID_AMOUNT_UAH = 650;
const AMAZON_MID_AMOUNT = AMAZON_MID_AMOUNT_UAH * PRECISION;
const AMAZON_YEAR = 2026;
const AMAZON_EXACT_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 20, 8, 0, 0);
const AMAZON_MID_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 21, 11, 0, 0);
const AMAZON_CLOSE_EXPENSE_OPERATED_AT = new Date(AMAZON_YEAR, 0, 21, 12, 50, 0);
const AMAZON_EXACT_REFUND_DELAY_SECONDS = 29 * 60 * 60;

const TWIN_TITLE = 'Uber';
const TWIN_REFUND_TITLE = 'Скасування. Uber';
const TWIN_AMOUNT_UAH = 240;
const TWIN_AMOUNT = TWIN_AMOUNT_UAH * PRECISION;
const TWIN_MISMATCH_AMOUNT_UAH = 310;
const TWIN_MISMATCH_AMOUNT = TWIN_MISMATCH_AMOUNT_UAH * PRECISION;
const TWIN_YEAR = 2026;
const TWIN_FIRST_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 8, 0, 0);
const TWIN_SECOND_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 20, 0, 0);
const TWIN_MISMATCH_EXPENSE_OPERATED_AT = new Date(TWIN_YEAR, 1, 10, 20, 30, 0);
const TWIN_SECOND_REFUND_DELAY_SECONDS = 60 * 60;

describe('consolidation/refund-pair-localized-exact-amount', () => {
    it('auto-consolidates a localized refund to its unique exact-amount candidate over a closer-in-time mismatch', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });

        testSeedService.refundedExpense({
            accountId: account.id,
            title: AMAZON_TITLE,
            expenseAmount: AMAZON_CLOSE_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: AMAZON_CLOSE_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'amazon-close'
        });
        testSeedService.refundedExpense({
            accountId: account.id,
            title: AMAZON_TITLE,
            expenseAmount: AMAZON_MID_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: AMAZON_MID_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'amazon-mid'
        });
        const { expense: exactExpense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: AMAZON_TITLE,
            expenseAmount: AMAZON_EXACT_AMOUNT,
            refundAmounts: [AMAZON_EXACT_AMOUNT],
            refundTitle: AMAZON_REFUND_TITLE,
            expenseOperatedAt: AMAZON_EXACT_EXPENSE_OPERATED_AT,
            refundDelaySeconds: AMAZON_EXACT_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'amazon-exact'
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        expect(autoCandidates).toEqual([
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                expenseTransactionId: exactExpense.id,
                refundIncomeTransactionIds: [refunds[0].id]
            })
        ]);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(exactExpense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionById(refunds[0].id).consolidationParentTransactionId).toBe(exactExpense.id);
    });

    it('does not auto-consolidate when two candidates share an exact amount match (identical fare twins)', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });

        testSeedService.refundedExpense({
            accountId: account.id,
            title: TWIN_TITLE,
            expenseAmount: TWIN_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: TWIN_FIRST_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'twin-first'
        });
        testSeedService.refundedExpense({
            accountId: account.id,
            title: TWIN_TITLE,
            expenseAmount: TWIN_MISMATCH_AMOUNT,
            refundAmounts: [],
            expenseOperatedAt: TWIN_MISMATCH_EXPENSE_OPERATED_AT,
            externalIdPrefix: 'twin-mismatch'
        });
        const { expense: secondExpense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: TWIN_TITLE,
            expenseAmount: TWIN_AMOUNT,
            refundAmounts: [TWIN_AMOUNT],
            refundTitle: TWIN_REFUND_TITLE,
            expenseOperatedAt: TWIN_SECOND_EXPENSE_OPERATED_AT,
            refundDelaySeconds: TWIN_SECOND_REFUND_DELAY_SECONDS,
            externalIdPrefix: 'twin-second'
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(autoCandidates).toHaveLength(0);
        expect(reviewCandidates).toEqual([
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                expenseTransactionId: secondExpense.id,
                refundIncomeTransactionIds: [refunds[0].id]
            })
        ]);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
    });
});
