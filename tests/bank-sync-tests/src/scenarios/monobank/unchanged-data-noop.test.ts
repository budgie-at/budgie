import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { BankSyncEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobankTx, setupMonobankFixture, setupScenario, stubStatement, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

describe('monobank/unchanged-data-noop', () => {
    it('re-sync of identical data does not touch updatedAt on transactions or entries', async () => {
        const { bankSync } = setupMonobankFixture();

        const txPayload = buildMonobankTx({ id: 'tx-stable', amount: -2500, hold: false });
        stubStatement([txPayload]);
        await monobankSyncService.sync();

        const txAfterFirst = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-stable')).all()[0];
        const entryAfterFirst = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-stable'))
            .all()[0];

        // Rewind cursor so the second sync re-fetches the same row
        testDb
            .update(BankSyncEntityTable)
            .set({ forwardSyncFromAt: new Date(2026, 0, 1) } as never)
            .where(eq(BankSyncEntityTable.id, bankSync.id))
            .run();

        stubStatement([txPayload]);
        await monobankSyncService.sync();

        const txAfterSecond = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-stable')).all()[0];
        const entryAfterSecond = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-stable'))
            .all()[0];

        expect(txAfterSecond.updatedAt?.getTime()).toBe(txAfterFirst.updatedAt?.getTime());
        expect(entryAfterSecond.updatedAt?.getTime()).toBe(entryAfterFirst.updatedAt?.getTime());

        const allRows = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-stable')).all();
        expect(allRows).toHaveLength(1);
    });
});
