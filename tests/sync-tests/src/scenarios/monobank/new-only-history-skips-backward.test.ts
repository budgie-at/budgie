import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchPersistedMonobankTransactions, fetchSyncById, seed, stubEmptyStatements } from '../../harness';

describe('monobank/new-only-history-skips-backward', () => {
    it('completes the backward sweep with zero statement requests when backwardSyncFromAt equals backwardSyncLimitAt', async () => {
        const historyBoundary = new Date();
        const account = seed.account({ externalId: 'mono-acc-new-only', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const bankSync = seed.sync({
            accountId: account.id,
            mode: SyncModeEnum.BACKWARD,
            backwardSyncFromAt: historyBoundary,
            backwardSyncLimitAt: historyBoundary,
            forwardSyncedAt: historyBoundary
        });

        const requestedFromValues: number[] = [];
        stubEmptyStatements(fromUnixSeconds => {
            requestedFromValues.push(fromUnixSeconds);
        });

        await monobankSyncService.sync();

        expect(requestedFromValues).toHaveLength(0);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);

        const finalSync = fetchSyncById(bankSync.id);
        expect(finalSync.mode).toBe(SyncModeEnum.FORWARD);
    });
});
