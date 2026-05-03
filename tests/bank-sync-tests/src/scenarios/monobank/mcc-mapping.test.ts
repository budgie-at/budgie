import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { MccCategoryEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/mcc-mapping', () => {
    it('resolves the MCC code to the matching mcc_categories row id on insert', async () => {
        const groceryRow = testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, '5411')).all()[0];
        expect(groceryRow).toBeDefined();

        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-grocery', amount: -2500, hold: false, mcc: 5411, originalMcc: 5411 })]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-grocery'))
            .all()[0];
        expect(entry.mccCategoryId).toBe(groceryRow.id);
    });

    it('leaves mccCategoryId null when the MCC is unknown', async () => {
        setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({ id: 'tx-unknown-mcc', amount: -2500, hold: false, mcc: 99999, originalMcc: 99999 })
        ]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-unknown-mcc'))
            .all()[0];
        expect(entry.mccCategoryId).toBeNull();
    });
});
