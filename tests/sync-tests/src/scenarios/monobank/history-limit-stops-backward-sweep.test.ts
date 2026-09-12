import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchPersistedMonobankTransactions, fetchSyncById, seed, stubEmptyStatements, subtractMonths } from '../../harness';

const HISTORY_LIMIT_MONTHS = 1;
const MS_PER_SECOND = 1_000;

const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / MS_PER_SECOND);

describe('monobank/history-limit-stops-backward-sweep', () => {
    it('clamps the single backward request window to backwardSyncLimitAt and completes immediately', async () => {
        const now = new Date();
        const backwardSyncLimitAt = subtractMonths(now, HISTORY_LIMIT_MONTHS);
        const account = seed.account({ externalId: 'mono-acc-history-limit', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const bankSync = seed.sync({
            accountId: account.id,
            mode: SyncModeEnum.BACKWARD,
            backwardSyncFromAt: now,
            backwardSyncLimitAt,
            forwardSyncedAt: now
        });

        const requestedFromValues: number[] = [];
        stubEmptyStatements(fromUnixSeconds => {
            requestedFromValues.push(fromUnixSeconds);
        });

        await monobankSyncService.sync();

        expect(requestedFromValues).toHaveLength(1);
        expect(requestedFromValues[0]).toBe(toUnixSeconds(backwardSyncLimitAt));
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);

        const finalSync = fetchSyncById(bankSync.id);
        expect(finalSync.mode).toBe(SyncModeEnum.FORWARD);
    });
});
