import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchSyncById, seed } from '../../harness';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

const MONOBANK_OLD_TOKEN = 'shared-monobank-old-token';
const MONOBANK_NEW_TOKEN = 'monobank-new-token';
const SELECTED_FORWARD_SYNC_FROM_AT = new Date('2026-04-01T10:00:00.000Z');
const SHARED_FORWARD_SYNC_FROM_AT = new Date('2026-04-02T10:00:00.000Z');

interface ExpectedForwardSyncInterface {
    readonly errorCount: number;
    readonly forwardSyncFromAt: Date;
    readonly lastError: string | null;
    readonly token: string;
}

interface MonobankRotationScenarioInterface {
    readonly selectedAccount: AccountEntityInterface;
    readonly selectedSync: SyncEntityInterface;
    readonly sharedSync: SyncEntityInterface;
}

const seedMonobankAccount = (externalId: string): AccountEntityInterface =>
    seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC
    });

const seedFailedForwardSync = (accountId: number, errorCount: number, forwardSyncFromAt: Date, lastError: string): SyncEntityInterface =>
    seed.sync({
        accountId,
        token: MONOBANK_OLD_TOKEN,
        provider: ExternalSourceEnum.MONOBANK,
        mode: SyncModeEnum.FORWARD,
        status: SyncStatusEnum.FAILED,
        forwardSyncFromAt,
        forwardSyncedAt: null,
        backwardSyncFromAt: null,
        backwardSyncedAt: null,
        errorCount,
        lastError
    });

const seedMonobankCredentialRotationScenario = (): MonobankRotationScenarioInterface => {
    const selectedAccount = seedMonobankAccount('monobank-selected');
    const sharedAccount = seedMonobankAccount('monobank-shared');

    return {
        selectedAccount,
        selectedSync: seedFailedForwardSync(selectedAccount.id, 2, SELECTED_FORWARD_SYNC_FROM_AT, 'selected monobank failure'),
        sharedSync: seedFailedForwardSync(sharedAccount.id, 3, SHARED_FORWARD_SYNC_FROM_AT, 'shared monobank failure')
    };
};

const expectForwardSync = (sync: SyncEntityInterface, expected: ExpectedForwardSyncInterface): void => {
    expect(sync).toMatchObject({
        token: expected.token,
        errorCount: expected.errorCount,
        lastError: expected.lastError,
        mode: SyncModeEnum.FORWARD,
        status: SyncStatusEnum.FAILED
    });
    expect(sync.forwardSyncFromAt).toEqual(expected.forwardSyncFromAt);
    expect(sync.forwardSyncedAt).toBeNull();
    expect(sync.backwardSyncFromAt).toBeNull();
    expect(sync.backwardSyncedAt).toBeNull();
};

const expectMonobankCredentialRotationScenario = (scenario: MonobankRotationScenarioInterface): void => {
    expectForwardSync(fetchSyncById(scenario.selectedSync.id), {
        errorCount: 0,
        forwardSyncFromAt: SELECTED_FORWARD_SYNC_FROM_AT,
        lastError: null,
        token: MONOBANK_NEW_TOKEN
    });
    expectForwardSync(fetchSyncById(scenario.sharedSync.id), {
        errorCount: 3,
        forwardSyncFromAt: SHARED_FORWARD_SYNC_FROM_AT,
        lastError: 'shared monobank failure',
        token: MONOBANK_OLD_TOKEN
    });
};

describe('Monobank credential rotation', () => {
    it('keeps generic token updates scoped to the selected sync row', async () => {
        const scenario = seedMonobankCredentialRotationScenario();

        await monobankSyncService.updateAccountToken(scenario.selectedAccount.id, MONOBANK_NEW_TOKEN);
        expectMonobankCredentialRotationScenario(scenario);
    });
});
