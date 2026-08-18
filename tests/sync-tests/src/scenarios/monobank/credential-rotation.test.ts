import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchAccountIntegrationToken, fetchSyncById, seed } from '../../harness';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

const MONOBANK_OLD_TOKEN = 'shared-monobank-old-token';
const MONOBANK_SEPARATE_TOKEN = 'separate-monobank-token';
const MONOBANK_NEW_TOKEN = 'monobank-new-token';
const SELECTED_FORWARD_SYNC_FROM_AT = new Date('2026-04-01T10:00:00.000Z');
const SHARED_FORWARD_SYNC_FROM_AT = new Date('2026-04-02T10:00:00.000Z');
const SEPARATE_FORWARD_SYNC_FROM_AT = new Date('2026-04-03T10:00:00.000Z');

interface ExpectedForwardSyncInterface {
    readonly errorCount: number;
    readonly forwardSyncFromAt: Date;
    readonly lastError: string | null;
}

interface MonobankRotationScenarioInterface {
    readonly selectedAccount: AccountEntityInterface;
    readonly sharedAccount: AccountEntityInterface;
    readonly separateAccount: AccountEntityInterface;
    readonly selectedSync: SyncEntityInterface;
    readonly sharedSync: SyncEntityInterface;
    readonly separateSync: SyncEntityInterface;
}

const seedMonobankAccount = (externalId: string): AccountEntityInterface =>
    seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC
    });

const seedFailedForwardSync = (
    accountId: number,
    token: string,
    errorCount: number,
    forwardSyncFromAt: Date,
    lastError: string
): SyncEntityInterface =>
    seed.sync({
        accountId,
        token,
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
    const separateAccount = seedMonobankAccount('monobank-separate');

    return {
        selectedAccount,
        sharedAccount,
        separateAccount,
        selectedSync: seedFailedForwardSync(
            selectedAccount.id,
            MONOBANK_OLD_TOKEN,
            2,
            SELECTED_FORWARD_SYNC_FROM_AT,
            'selected monobank failure'
        ),
        sharedSync: seedFailedForwardSync(sharedAccount.id, MONOBANK_OLD_TOKEN, 3, SHARED_FORWARD_SYNC_FROM_AT, 'shared monobank failure'),
        separateSync: seedFailedForwardSync(
            separateAccount.id,
            MONOBANK_SEPARATE_TOKEN,
            4,
            SEPARATE_FORWARD_SYNC_FROM_AT,
            'separate monobank failure'
        )
    };
};

const expectForwardSync = (sync: SyncEntityInterface, expected: ExpectedForwardSyncInterface): void => {
    expect(sync).toMatchObject({
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

describe('Monobank credential rotation', () => {
    it('rotates the shared integration token for every account in the credential group', async () => {
        const scenario = seedMonobankCredentialRotationScenario();

        await monobankSyncService.updateAccountToken(scenario.selectedAccount.id, MONOBANK_NEW_TOKEN);

        expect(fetchAccountIntegrationToken(scenario.selectedAccount.id)).toBe(MONOBANK_NEW_TOKEN);
        expect(fetchAccountIntegrationToken(scenario.sharedAccount.id)).toBe(MONOBANK_NEW_TOKEN);
        expect(fetchAccountIntegrationToken(scenario.separateAccount.id)).toBe(MONOBANK_SEPARATE_TOKEN);
    });

    it('clears sync error state across the credential group and leaves other integrations untouched', async () => {
        const scenario = seedMonobankCredentialRotationScenario();

        await monobankSyncService.updateAccountToken(scenario.selectedAccount.id, MONOBANK_NEW_TOKEN);

        expectForwardSync(fetchSyncById(scenario.selectedSync.id), {
            errorCount: 0,
            forwardSyncFromAt: SELECTED_FORWARD_SYNC_FROM_AT,
            lastError: null
        });
        expectForwardSync(fetchSyncById(scenario.sharedSync.id), {
            errorCount: 0,
            forwardSyncFromAt: SHARED_FORWARD_SYNC_FROM_AT,
            lastError: null
        });
        expectForwardSync(fetchSyncById(scenario.separateSync.id), {
            errorCount: 4,
            forwardSyncFromAt: SEPARATE_FORWARD_SYNC_FROM_AT,
            lastError: 'separate monobank failure'
        });
    });
});
