import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { SyncBalanceAuthorityEnum, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchSyncById, monobankStub, stubMonobankProviderBalance } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { seedMonobankForwardSyncAccounts } from '../../harness/monobank/seed-monobank-forward-sync-accounts';
import { setupAnchoredMonobankFixture } from '../../harness/monobank/setup-anchored-monobank-fixture';

describe('monobank/anchored-forward-catch-up', () => {
    it('keeps provider authority when backward completion moves to forward mode', async () => {
        const fixture = setupAnchoredMonobankFixture(SyncModeEnum.BACKWARD);
        let queuedYield = Promise.resolve();
        monobankStub.recordStatementAccountIds([], () => {
            queuedYield = syncWorkloadService.run('yield-after-backward', async () => Promise.resolve());
        });

        await syncWorkloadService.run('backward-run', () => monobankSyncService.sync());
        await queuedYield;

        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            mode: SyncModeEnum.FORWARD,
            balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER
        });
    });

    it('fetches a fresh provider balance after completed anchored forward catch-up', async () => {
        const fixture = setupAnchoredMonobankFixture();
        stubMonobankProviderBalance(fixture.externalId, 100);

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.LEDGER);
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(1);
    });

    it('does not reconcile an ordinary ledger-authoritative forward batch', async () => {
        seedMonobankForwardSyncAccounts(['mono-ledger'], new Date(Date.now() - 10 * 60 * 1000));
        monobankStub.statement([]);

        await monobankSyncService.sync();

        expect(fetchMonobankAdjustments(1)).toHaveLength(0);
    });
});
