import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';

import { PRECISION, TagEntityTable, TransactionConsolidationTypeEnum, TransactionTagsEntityTable } from '@budgie/contracts';

import { fetchTransactionById, seed, seedRefundedExpense, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/refund-pair-shared-tag', () => {
    it('reparents a refund whose income shares a tag with the expense without breaking the unique tag constraint', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });

        const [tag] = testDb
            .insert(TagEntityTable)
            .values({ title: 'Travel', titleSearch: 'travel', titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .returning()
            .all();

        testDb
            .insert(TransactionTagsEntityTable)
            .values([
                { transactionId: expense.id, tagId: tag.id, isPrimary: false },
                { transactionId: refunds[0].id, tagId: tag.id, isPrimary: false }
            ])
            .run();

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);
        expect(fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);

        const expenseTagRows = testDb
            .select()
            .from(TransactionTagsEntityTable)
            .where(and(eq(TransactionTagsEntityTable.transactionId, expense.id), eq(TransactionTagsEntityTable.tagId, tag.id)))
            .all();

        expect(expenseTagRows).toHaveLength(1);
    });
});
