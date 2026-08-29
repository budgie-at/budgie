import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

describe('monobank/hold-tx-inserted', () => {
    it('inserts a held transaction (regression: !hold filter must not drop it)', async () => {
        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-hold-1', amount: -2500, hold: true })]);

        await monobankSyncService.sync();

        const rows = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-hold-1')).all();
        expect(rows).toHaveLength(1);
    });
});
