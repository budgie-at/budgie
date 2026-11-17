import { ExternalSourceEnum, SyncEntityInterface, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';

import { BankIntegrationSyncStatusEnum } from '../src/sync/enum/bank-integration-sync-status.enum';
import { getBankIntegrationSyncStatus } from '../src/sync/utils/get-bank-integration-sync-status.util';
import { isBankIntegrationSyncStale } from '../src/sync/utils/is-bank-integration-sync-stale.util';

type StatementSync = Pick<
    SyncEntityInterface,
    'enabled' | 'status' | 'mode' | 'forwardSyncedAt' | 'provider' | 'reconciledAt' | 'setupBalance'
>;

const now = Date.UTC(2026, 10, 2, 12);
const sync = (status = SyncStatusEnum.IDLE, enabled = true, age = 0): StatementSync => ({
    provider: ExternalSourceEnum.MONOBANK,
    reconciledAt: null,
    setupBalance: null,
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
    ['all disabled', [sync(SyncStatusEnum.IDLE, false)], false, BankIntegrationSyncStatusEnum.PAUSED]
])('status: %s', (_label, syncs, rejected, expected) => {
    expect(getBankIntegrationSyncStatus(syncs, rejected)).toBe(expected);
});

it.each([
    ['empty', [], false],
    ['exactly 24 hours', [sync(SyncStatusEnum.IDLE, true, 86400000)], false],
    ['over 24 hours', [sync(SyncStatusEnum.IDLE, true, 86400001)], true],
    ['disabled recent sync ignored', [sync(SyncStatusEnum.IDLE, true, 86400001), sync(SyncStatusEnum.IDLE, false)], true],
    ['disabled stale sync ignored', [sync(), sync(SyncStatusEnum.IDLE, false, 86400001)], false]
])('stale: %s', (_label, syncs, expected) => {
    expect(isBankIntegrationSyncStale(syncs, now)).toBe(expected);
});

const statementSync = (provider: ExternalSourceEnum, reconciledAt: Date | null, setupBalance: number | null): StatementSync => ({
    ...sync(),
    provider,
    reconciledAt,
    setupBalance
});

it.each([
    [
        'unanchored privatbank',
        [statementSync(ExternalSourceEnum.PRIVATBANK, null, null)],
        false,
        BankIntegrationSyncStatusEnum.NEEDS_STATEMENT
    ],
    [
        'anchored privatbank',
        [statementSync(ExternalSourceEnum.PRIVATBANK, new Date(now), null)],
        false,
        BankIntegrationSyncStatusEnum.UP_TO_DATE
    ],
    [
        'setup balance privatbank',
        [statementSync(ExternalSourceEnum.PRIVATBANK, null, 100)],
        false,
        BankIntegrationSyncStatusEnum.UP_TO_DATE
    ],
    ['unanchored monobank', [statementSync(ExternalSourceEnum.MONOBANK, null, null)], false, BankIntegrationSyncStatusEnum.UP_TO_DATE],
    [
        'failure beats unanchored',
        [{ ...statementSync(ExternalSourceEnum.ERSTE, null, null), status: SyncStatusEnum.FAILED }],
        false,
        BankIntegrationSyncStatusEnum.NEEDS_ATTENTION
    ]
])('statement anchor: %s', (_label, syncs, rejected, expected) => {
    expect(getBankIntegrationSyncStatus(syncs, rejected)).toBe(expected);
});
