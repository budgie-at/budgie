import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionEntityTable } from '@budgie/contracts';

import { buildMonobankTx, setupMonobankFixture, setupScenario, stubStatement, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

describe('monobank/hold-tx-inserted', () => {
    it('inserts a held transaction (regression: !hold filter must not drop it)', async () => {
        setupMonobankFixture();
        stubStatement([buildMonobankTx({ id: 'tx-hold-1', amount: -2500, hold: true })]);

        await monobankSyncService.sync();

        const rows = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-hold-1')).all();
        expect(rows).toHaveLength(1);
    });
});
