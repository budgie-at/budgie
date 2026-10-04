import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { RefundPairRepository } from '@budgie/consolidation';
import { LanguageEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seedRefundedExpenseOnCard } from '../harness/seed-refunded-expense-on-card';
import { TestLayer } from '../harness/test-context';

const COMFY_REVIEW_AMOUNT_UAH = 120;
const COMFY_REVIEW_AMOUNT = convertToMicroUnits(COMFY_REVIEW_AMOUNT_UAH);
const COMFY_REFUND_DELAY_SECONDS = 40 * 24 * 60 * 60;

layer(TestLayer)('consolidation/refund-pair-review-null-mcc', it => {
    it.effect('surfaces a prefix-stripped pair without MCC data for manual review', () =>
        Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const { expense, refunds } = yield* seedRefundedExpenseOnCard('mono-card', {
                expenseAmount: COMFY_REVIEW_AMOUNT,
                refundAmounts: [COMFY_REVIEW_AMOUNT],
                title: 'Платіж COMFY',
                refundTitle: 'Повернення платежу COMFY, Київ',
                refundDelaySeconds: COMFY_REFUND_DELAY_SECONDS
            });

            const autoCandidates = yield* refundPairRepository.findCandidates();
            const reviewCandidates = yield* refundPairRepository.findReviewCandidates();
            const manualCandidates = yield* refundPairRepository.findRefundableExpenseCandidates(refunds[0].id, '', LanguageEnum.EN);

            expect(autoCandidates).toHaveLength(0);
            expect(reviewCandidates.length).toBeGreaterThanOrEqual(1);
            expect(manualCandidates).toMatchObject([{ id: expense.id, title: 'Платіж COMFY', isRecommended: true }]);
        })
    );
});
