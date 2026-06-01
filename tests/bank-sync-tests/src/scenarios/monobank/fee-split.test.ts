import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BANK_FEE_CATEGORY_ID, CategoryEntityTable, CategorySourceEnum, PRECISION, TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

describe('monobank/fee-split', () => {
    it('splits the commission into a dedicated Bank Fees & Charges entry', async () => {
        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-fee', amount: -6000, hold: false, commissionRate: -1000 })]);

        await monobankSyncService.sync();

        const [mainEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee'))
            .all();
        const [feeEntry] = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee:fee'))
            .all();

        const [feeCategory] = testDb.select().from(CategoryEntityTable).where(eq(CategoryEntityTable.id, BANK_FEE_CATEGORY_ID)).all();

        expect(mainEntry.amount).toBe(50 * PRECISION);
        expect(feeEntry.amount).toBe(10 * PRECISION);
        expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);
        expect(feeEntry.categorySource).toBe(CategorySourceEnum.FEE);
        expect(feeCategory.title).toBe('Bank Fees & Charges');
    });

    it('keeps a single entry when there is no commission', async () => {
        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-no-fee', amount: -6000, hold: false, commissionRate: 0 })]);

        await monobankSyncService.sync();

        const entries = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-fee:fee'))
            .all();

        expect(entries).toHaveLength(0);
    });
});
