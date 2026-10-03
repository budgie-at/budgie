import { PRECISION } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectRefundCanonicalTags } from '../harness/expect-refund-canonical-tags';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testSeedService, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/refund-pair-shared-tag', it => {
    it.effect('reparents a refund whose income shares a tag with the expense without duplicating the tag', () =>
        Effect.gen(function* () {
            const tag = yield* testSeedService.tag('Travel');
            const { consolidated, expense } = yield* runRefundScenario({
                beforeConsolidation: ({ expense, refunds }) =>
                    Effect.all([testSeedService.transactionTag(expense.id, tag.id), testSeedService.transactionTag(refunds[0].id, tag.id)]),
                expenseAmount: 120 * PRECISION,
                externalIdPrefix: 'shared-tag',
                refundAmounts: [120 * PRECISION]
            });

            expect(consolidated).toBe(1);
            yield* expectRefundCanonicalTags(expense.id, [tag.id]);
        })
    );
});
