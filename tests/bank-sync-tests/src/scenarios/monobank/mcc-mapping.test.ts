import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { MccCategoryEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobankTx } from '../../harness/monobank-fixtures';
import { stubStatement } from '../../harness/monobank-server';
import { setupMonobankFixture } from '../../harness/setup-monobank-fixture';
import { setupScenario } from '../../harness/setup-scenario';
import { testDb } from '../../harness/setup';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

describe('monobank/mcc-mapping', () => {
    it('resolves the MCC code to the matching mcc_categories row id on insert', async () => {
        const groceryRow = testDb.select().from(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, '5411')).all()[0];
        expect(groceryRow).toBeDefined();

        setupMonobankFixture();
        stubStatement([buildMonobankTx({ id: 'tx-grocery', amount: -2500, hold: false, mcc: 5411, originalMcc: 5411 })]);

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
        stubStatement([buildMonobankTx({ id: 'tx-unknown-mcc', amount: -2500, hold: false, mcc: 99999, originalMcc: 99999 })]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-unknown-mcc'))
            .all()[0];
        expect(entry.mccCategoryId).toBeNull();
    });
});
