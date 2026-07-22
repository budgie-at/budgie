import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { expectRefundCanonicalTags } from '../harness/expect-refund-canonical-tags';
import { runRefundScenario } from '../harness/run-refund-scenario';
import { testSeedService } from '../harness/test-context';

describe('consolidation/refund-pair-shared-tag', () => {
    it('reparents a refund whose income shares a tag with the expense without duplicating the tag', async () => {
        const tag = testSeedService.tag('Travel');
        const { consolidated, expense } = await runRefundScenario({
            beforeConsolidation: ({ expense, refunds }) => {
                testSeedService.transactionTag(expense.id, tag.id);
                testSeedService.transactionTag(refunds[0].id, tag.id);
            },
            expenseAmount: 120 * PRECISION,
            externalIdPrefix: 'shared-tag',
            refundAmounts: [120 * PRECISION]
        });

        expect(consolidated).toBe(1);
        expectRefundCanonicalTags(expense.id, [tag.id]);
    });
});
