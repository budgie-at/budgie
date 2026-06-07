import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { PRECISION, TagEntityTable, TransactionConsolidationTypeEnum, TransactionTagsEntityTable } from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, seed, seedRefundedExpense, seedTransferPairFixture, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const insertTag = (title: string) =>
    testDb
        .insert(TagEntityTable)
        .values({ title, titleSearch: title.toLowerCase(), titleEn: null, titleTags: null, tagsGeneratedAt: null })
        .returning()
        .get();

const fetchTagRows = (transactionId: number) =>
    testDb.select().from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transactionId)).all();

describe('consolidation/consolidation-tag-copy-behavior', () => {
    it('does not copy source tags to a canonical transfer', async () => {
        const { expense, income } = seedTransferPairFixture();
        const tag = insertTag('Travel');

        testDb
            .insert(TransactionTagsEntityTable)
            .values([
                { transactionId: expense.id, tagId: tag.id, isPrimary: false },
                { transactionId: income.id, tagId: tag.id, isPrimary: false }
            ])
            .run();

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(fetchTagRows(canonicals[0].id)).toHaveLength(0);
    });

    it('copies refund income tags to the expense canonical', async () => {
        const account = seed.account({ externalId: 'mono-card' });
        const { expense, refunds } = seedRefundedExpense({
            accountId: account.id,
            expenseAmount: 120 * PRECISION,
            refundAmounts: [120 * PRECISION]
        });
        const tag = insertTag('Refund Source');

        testDb.insert(TransactionTagsEntityTable).values({ transactionId: refunds[0].id, tagId: tag.id, isPrimary: false }).run();

        const result = await transferConsolidationService.consolidate();
        expect(result.consolidated).toBe(1);

        expect(fetchTransactionById(expense.id).consolidationType).toBe(TransactionConsolidationTypeEnum.REFUND);
        expect(fetchTagRows(expense.id).map(row => row.tagId)).toEqual([tag.id]);
    });
});
