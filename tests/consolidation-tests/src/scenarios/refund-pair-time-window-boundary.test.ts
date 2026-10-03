import { PRECISION, REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { runRefundScenario } from '../harness/run-refund-scenario';
import { testQueryService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/refund-pair-time-window-boundary', it => {
    it.effect('auto-consolidates a refund exactly at the 30-day boundary', () =>
        Effect.gen(function* () {
            const { consolidated, expense, refunds } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION],
                refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS
            });

            expect(consolidated).toBe(1);
            expect((yield* testQueryService.fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBe(expense.id);
        })
    );

    it.effect('leaves a refund outside the 30-day boundary unconsolidated', () =>
        Effect.gen(function* () {
            const { consolidated, refunds } = yield* runRefundScenario({
                expenseAmount: 120 * PRECISION,
                refundAmounts: [120 * PRECISION],
                refundDelaySeconds: REFUND_TIME_WINDOW_SECONDS + 1
            });

            expect(consolidated).toBe(0);
            expect((yield* testQueryService.fetchTransactionById(refunds[0].id)).consolidationParentTransactionId).toBeNull();
        })
    );
});
