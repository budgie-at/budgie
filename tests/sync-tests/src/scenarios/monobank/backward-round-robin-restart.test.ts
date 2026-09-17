import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { describe, expect, it } from 'vitest';

import { monobankStub } from '../../harness';
import { seedMonobankBackwardSyncAccounts } from '../../harness/monobank/seed-monobank-backward-sync-accounts';
import { resetMonobankSyncSingleton } from '../../harness/scenario/reset-singletons';

const runOneBatch = async (runName: string, requestedAccountIds: string[]): Promise<void> => {
    let queuedYield = Promise.resolve();
    let hasQueuedYield = false;
    monobankStub.recordStatementAccountIds(requestedAccountIds, () => {
        if (!hasQueuedYield) {
            hasQueuedYield = true;
            queuedYield = syncWorkloadService.run(`${runName}-yield`, async () => Promise.resolve());
        }
    });

    await syncWorkloadService.run(runName, () => monobankSyncService.sync());
    await queuedYield;
};

describe('monobank/backward-round-robin-restart', () => {
    it('continues with the next account after service state is reset', async () => {
        const requestedAccountIds: string[] = [];
        seedMonobankBackwardSyncAccounts(['mono-a', 'mono-b', 'mono-c']);
        monobankStub.recordStatementAccountIds(requestedAccountIds);

        await runOneBatch('first-run', requestedAccountIds);
        resetMonobankSyncSingleton();
        await runOneBatch('second-run', requestedAccountIds);

        expect(requestedAccountIds).toStrictEqual(['mono-a', 'mono-b']);
    });
});
