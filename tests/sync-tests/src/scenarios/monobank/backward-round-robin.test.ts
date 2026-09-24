import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { monobankStub, seed, testDb } from '../../harness';

const seedBackwardSyncs = (): number[] =>
    ['mono-a', 'mono-b', 'mono-c'].map(externalId => {
        const account = seed.account({ externalId });

        return seed.sync({ accountId: account.id, mode: SyncModeEnum.BACKWARD, backwardSyncFromAt: new Date() }).id;
    });

const recordFirstRequests = async (count: number): Promise<string[]> => {
    const requestedAccountIds: string[] = [];
    monobankStub.recordStatementAccountIds(requestedAccountIds);

    await monobankSyncService.sync();

    return requestedAccountIds.slice(0, count);
};

describe('monobank/backward-round-robin', () => {
    it('gives every unfinished account one backward batch before any account gets its next one', async () => {
        seedBackwardSyncs();

        await expect(recordFirstRequests(6)).resolves.toStrictEqual(['mono-a', 'mono-b', 'mono-c', 'mono-a', 'mono-b', 'mono-c']);
    });

    it('resumes the rotation from persisted batch times after a restart', async () => {
        const [monoASyncId] = seedBackwardSyncs();
        testDb.update(SyncEntityTable).set({ backwardBatchAt: new Date() }).where(eq(SyncEntityTable.id, monoASyncId)).run();

        await expect(recordFirstRequests(3)).resolves.toStrictEqual(['mono-b', 'mono-c', 'mono-a']);
    });
});
