import { syncRepository } from '@app/@generic/drizzle/db/db';
import { SYNC_ERROR_THRESHOLD } from '@app/sync/constant/sync-error-threshold.constant';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncBalanceAuthorityEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { buildMonobank, fetchSyncById, monobankStub } from '../../harness';
import { fetchMonobankAdjustments } from '../../harness/db/fetch-monobank-adjustments';
import { setupAnchoredMonobankFixture } from '../../harness/monobank/setup-anchored-monobank-fixture';

describe('monobank/reconciliation-recovery', () => {
    it('leaves anchor and progress unchanged when fresh provider retrieval fails', async () => {
        const fixture = setupAnchoredMonobankFixture();
        await syncRepository.update(fixture.sync.id, { errorCount: SYNC_ERROR_THRESHOLD });
        const initialSync = fetchSyncById(fixture.sync.id);
        monobankStub.statement([]);
        monobankStub.clientInfoFailure();

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id)).toMatchObject({
            balanceAuthority: SyncBalanceAuthorityEnum.PROVIDER,
            forwardSyncFromAt: initialSync.forwardSyncFromAt,
            forwardSyncedAt: null
        });
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
    });

    it('does not finalize after the run is interrupted during the provider response', async () => {
        const fixture = setupAnchoredMonobankFixture();
        monobankStub.statement([]);
        monobankStub.clientInfo(
            buildMonobank.clientInfo({
                accounts: [buildMonobank.account({ id: fixture.externalId, balance: 100 })],
                jars: []
            }),
            () => monobankSyncService.interruptActiveRun()
        );

        await monobankSyncService.sync();

        expect(fetchSyncById(fixture.sync.id).balanceAuthority).toBe(SyncBalanceAuthorityEnum.PROVIDER);
        expect(fetchMonobankAdjustments(fixture.account.id)).toHaveLength(0);
    });
});
