import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { describe, expect, it } from 'vitest';

import { refundPairRepository, testSeedService } from '../harness/test-context';

const COMFY_REVIEW_AMOUNT_UAH = 120;
const COMFY_REVIEW_AMOUNT = convertToMicroUnits(COMFY_REVIEW_AMOUNT_UAH);

describe('consolidation/refund-pair-review-null-mcc', () => {
    it('surfaces a prefix-stripped pair without MCC data for manual review', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: COMFY_REVIEW_AMOUNT,
            refundAmounts: [COMFY_REVIEW_AMOUNT],
            title: 'Платіж COMFY',
            refundTitle: 'Повернення платежу COMFY, Київ'
        });

        const autoCandidates = await refundPairRepository.findCandidates();
        const reviewCandidates = await refundPairRepository.findReviewCandidates();
        const manualCandidates = await refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '');

        expect(autoCandidates).toHaveLength(0);
        expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);
        expect(manualCandidates).toMatchObject([{ id: expense.id, title: 'Платіж COMFY', isRecommended: true }]);
    });
});
