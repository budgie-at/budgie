import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/refund-pair-shared-tag', () => {
    it('reparents a refund whose income shares a tag with the expense without duplicating the tag', async () => {
        const account = testSeedService.account({ externalId: 'mono-card' });
        const { expense, refunds } = testSeedService.refundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });
        const tag = testSeedService.tag('Travel');

        testSeedService.transactionTag(expense.id, tag.id);
        testSeedService.transactionTag(refunds[0].id, tag.id);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(testQueryService.fetchTransactionTagIds(expense.id)).toEqual([tag.id]);
    });
});
