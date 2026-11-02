import { SyncEntityInterface, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';

import { BankIntegrationSyncStatusEnum } from '../src/sync/enum/bank-integration-sync-status.enum';
import { getBankIntegrationSyncStatus } from '../src/sync/utils/get-bank-integration-sync-status.util';

const now = Date.UTC(2026, 10, 2, 12);
const sync = (
    status = SyncStatusEnum.IDLE,
    enabled = true,
    age = 0
): Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt'> => ({
    enabled,
    status,
    mode: SyncModeEnum.FORWARD,
    forwardSyncedAt: new Date(now - age)
});

it.each([
    ['empty', [], false, BankIntegrationSyncStatusEnum.UP_TO_DATE],
    ['key rejected beats failure', [sync(SyncStatusEnum.FAILED)], true, BankIntegrationSyncStatusEnum.KEY_REJECTED],
    [
        'failure beats syncing',
        [sync(SyncStatusEnum.SYNCING), sync(SyncStatusEnum.FAILED)],
        false,
        BankIntegrationSyncStatusEnum.NEEDS_ATTENTION
    ],
    ['all disabled', [sync(SyncStatusEnum.IDLE, false)], false, BankIntegrationSyncStatusEnum.PAUSED],
    ['exactly 24 hours', [sync(SyncStatusEnum.IDLE, true, 86400000)], false, BankIntegrationSyncStatusEnum.UP_TO_DATE],
    ['over 24 hours', [sync(SyncStatusEnum.IDLE, true, 86400001)], false, BankIntegrationSyncStatusEnum.STALE],
    [
        'disabled recent sync ignored',
        [sync(SyncStatusEnum.IDLE, true, 86400001), sync(SyncStatusEnum.IDLE, false)],
        false,
        BankIntegrationSyncStatusEnum.STALE
    ],
    ['disabled stale sync ignored', [sync(), sync(SyncStatusEnum.IDLE, false, 86400001)], false, BankIntegrationSyncStatusEnum.UP_TO_DATE]
])('%s', (_label, syncs, rejected, expected) => {
    expect(getBankIntegrationSyncStatus(syncs, rejected, now)).toBe(expected);
});
