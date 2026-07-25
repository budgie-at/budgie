import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { runConsolidation } from '../harness/run-consolidation';
import { refundPairRepository, testQueryService, testSeedService } from '../harness/test-context';

const REFUND_TITLE = 'Скасування. Netflix';
const LOCALIZED_EXPENSE_TITLE = 'Netflix';
const CONTESTED_AMOUNT = 700 * PRECISION;
const LOCALIZED_AMOUNT = 500 * PRECISION;
const CONTESTED_EXPENSE_OPERATED_AT = new Date(2026, 0, 10, 8, 0, 0);
const LOCALIZED_EXPENSE_OPERATED_AT = new Date(2026, 0, 12, 8, 0, 0);
const ONE_DAY_SECONDS = 24 * 60 * 60;

describe('consolidation/refund-pair-cross-bucket-localized-exact-amount', () => {
    it('recovers a unique localized exact-amount refund hidden behind a higher-priority exact-title collision', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });

        const { expense: exactTitleExpense } = testSeedService.refundedExpense({
            accountId: account.id,
            title: REFUND_TITLE,
            refundTitle: REFUND_TITLE,
            expenseAmount: CONTESTED_AMOUNT,
            refundAmounts: [CONTESTED_AMOUNT],
            expenseOperatedAt: CONTESTED_EXPENSE_OPERATED_AT,
            refundDelaySeconds: ONE_DAY_SECONDS,
            externalIdPrefix: 'exact-title'
        });

        const { expense: localizedExpense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            title: LOCALIZED_EXPENSE_TITLE,
            refundTitle: REFUND_TITLE,
            expenseAmount: LOCALIZED_AMOUNT,
            refundAmounts: [LOCALIZED_AMOUNT],
            expenseOperatedAt: LOCALIZED_EXPENSE_OPERATED_AT,
            refundDelaySeconds: ONE_DAY_SECONDS,
            externalIdPrefix: 'localized'
        });

        const refund = refunds[0];

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();

        expect(autoCandidates).toContainEqual(
            expect.objectContaining({
                confidenceBucket: 'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
                expenseTransactionId: localizedExpense.id,
                refundIncomeTransactionIds: [refund.id]
            })
        );
        expect(
            autoCandidates.some(
                candidate =>
                    candidate.expenseTransactionId === exactTitleExpense.id && candidate.refundIncomeTransactionIds.includes(refund.id)
            )
        ).toBe(false);
        expect(reviewCandidates.some(candidate => candidate.refundIncomeTransactionIds.includes(refund.id))).toBe(false);

        await runConsolidation();

        expect(testQueryService.fetchTransactionById(refund.id).consolidationParentTransactionId).toBe(localizedExpense.id);
        expect(testQueryService.fetchTransactionById(localizedExpense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
    });
});
