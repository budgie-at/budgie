import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionEntityTable } from '@budgie/contracts';

import { buildMonobankClientInfoWith, buildMonobankTx, seed, setupScenario, stubClientInfo, stubStatement, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

describe('monobank/hold-tx-inserted', () => {
    it('inserts a held transaction (regression: !hold filter must not drop it)', async () => {
        const account = seed.account({ externalId: 'mono-acc-1', type: 'BANK_SYNC', instrumentId: 1 });
        seed.bankSync({ accountId: account.id, mode: 'FORWARD', forwardSyncFromAt: new Date(2026, 0, 1) });

        stubClientInfo(buildMonobankClientInfoWith(['mono-acc-1']));
        stubStatement([buildMonobankTx({ id: 'tx-hold-1', amount: -2500, hold: true })]);

        await monobankSyncService.sync();

        const rows = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-hold-1')).all();
        expect(rows).toHaveLength(1);
    });
});
