import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { describe, expect, it } from 'vitest';

import { monobankStub } from '../../harness';
import { seedMonobankBackwardSyncAccounts } from '../../harness/monobank/seed-monobank-backward-sync-accounts';

describe('monobank/backward-round-robin', () => {
    it('rotates accounts across non-terminal empty backward windows', async () => {
        const externalIds = ['mono-a', 'mono-b', 'mono-c'];
        const requestedAccountIds: string[] = [];
        seedMonobankBackwardSyncAccounts(externalIds);
        monobankStub.recordStatementAccountIds(requestedAccountIds);

        await monobankSyncService.sync();

        expect(requestedAccountIds.slice(0, 6)).toStrictEqual([
            'mono-a',
            'mono-b',
            'mono-c',
            'mono-a',
            'mono-b',
            'mono-c'
        ]);
    });
});
