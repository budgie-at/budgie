import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { BankSyncEntityTable, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';

import { buildMonobankTx, setupMonobankFixture, setupScenario, stubStatementSequence, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

const PAGE_SIZE = 500;

const buildBatch = (offset: number): unknown[] =>
    Array.from({ length: PAGE_SIZE }, (_, index) => {
        const ordinal = offset + index;
        return buildMonobankTx({
            id: `tx-page-${ordinal}`,
            amount: -1000,
            hold: false,
            time: Math.floor(new Date(2026, 0, 1, 0, 0, ordinal).getTime() / 1000)
        });
    });

describe('monobank/pagination-cursor-advances', () => {
    it('processes a 500-row page, advances the cursor, and continues until the next page is empty', async () => {
        const { bankSync } = setupMonobankFixture({ forwardSyncFromAt: new Date(2025, 0, 1) });

        stubStatementSequence(buildBatch(0));

        await monobankSyncService.sync();

        const persisted = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK))
            .all();
        expect(persisted).toHaveLength(PAGE_SIZE);

        const finalSync = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, bankSync.id)).all()[0];
        expect(finalSync.forwardSyncedAt).not.toBeNull();
        expect(finalSync.transactionCount).toBe(PAGE_SIZE);
    });
});
