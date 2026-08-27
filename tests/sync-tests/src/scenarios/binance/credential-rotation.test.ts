import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { AccountTypeEnum, ExternalSourceEnum, SyncEntityTable, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { fetchAccountIntegrationToken, fetchSyncById, seed, seedCryptoInstrument, testDb } from '../../harness';

import type { AccountEntityInterface, SyncEntityInterface } from '@budgie/contracts';

const SHARED_OLD_TOKEN = JSON.stringify({ apiKey: 'shared-old-key', apiSecret: 'shared-old-secret' });
const SEPARATE_OLD_TOKEN = JSON.stringify({ apiKey: 'separate-old-key', apiSecret: 'separate-old-secret' });
const NEW_TOKEN = JSON.stringify({ apiKey: 'shared-new-key', apiSecret: 'shared-new-secret' });
const SELECTED_FORWARD_SYNC_FROM_AT = new Date('2026-02-01T10:00:00.000Z');
const SELECTED_FORWARD_SYNCED_AT = new Date('2026-03-01T10:00:00.000Z');
const SHARED_FORWARD_SYNC_FROM_AT = new Date('2026-02-02T09:00:00.000Z');
const SHARED_FORWARD_SYNCED_AT = new Date('2026-03-02T09:00:00.000Z');
const SHARED_BACKWARD_SYNC_FROM_AT = new Date('2026-02-02T10:00:00.000Z');
const SHARED_BACKWARD_SYNCED_AT = new Date('2026-03-02T10:00:00.000Z');
const SEPARATE_FORWARD_SYNC_FROM_AT = new Date('2026-02-03T10:00:00.000Z');
const SEPARATE_FORWARD_SYNCED_AT = new Date('2026-03-03T10:00:00.000Z');
const DISABLED_FORWARD_SYNC_FROM_AT = new Date('2026-02-04T10:00:00.000Z');
const DELETED_FORWARD_SYNC_FROM_AT = new Date('2026-02-05T10:00:00.000Z');
const CROSS_PROVIDER_FORWARD_SYNC_FROM_AT = new Date('2026-02-06T10:00:00.000Z');

interface BinanceAccountsInterface {
    readonly crossProviderAccount: AccountEntityInterface;
    readonly deletedAccount: AccountEntityInterface;
    readonly disabledAccount: AccountEntityInterface;
    readonly selectedAccount: AccountEntityInterface;
    readonly separateAccount: AccountEntityInterface;
    readonly sharedAccount: AccountEntityInterface;
}

interface BinanceRotationScenarioInterface {
    readonly accounts: BinanceAccountsInterface;
    readonly syncs: BinanceSyncsInterface;
}

interface BinanceSyncsInterface {
    readonly crossProviderSync: SyncEntityInterface;
    readonly deletedSync: SyncEntityInterface;
    readonly disabledSync: SyncEntityInterface;
    readonly selectedSync: SyncEntityInterface;
    readonly separateSync: SyncEntityInterface;
    readonly sharedSync: SyncEntityInterface;
}

interface ExpectedForwardSyncInterface {
    readonly enabled: boolean;
    readonly errorCount: number;
    readonly forwardSyncedAt: Date | null;
    readonly forwardSyncFromAt: Date;
    readonly lastError: string | null;
}

interface SeedFailedForwardSyncInputInterface {
    readonly accountId: number;
    readonly enabled?: boolean;
    readonly errorCount: number;
    readonly forwardSyncedAt?: Date | null;
    readonly forwardSyncFromAt: Date;
    readonly lastError: string;
    readonly provider: ExternalSourceEnum;
    readonly token: string;
}

const seedBinanceAccount = (asset: string): AccountEntityInterface => {
    const instrument = seedCryptoInstrument(asset);

    return seed.account({
        externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset }),
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId: instrument.id
    });
};

const seedMonobankAccount = (externalId: string): AccountEntityInterface =>
    seed.account({
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC
    });

const seedFailedForwardSync = (input: SeedFailedForwardSyncInputInterface): SyncEntityInterface =>
    seed.sync({
        accountId: input.accountId,
        token: input.token,
        provider: input.provider,
        mode: SyncModeEnum.FORWARD,
        status: SyncStatusEnum.FAILED,
        enabled: input.enabled ?? true,
        forwardSyncFromAt: input.forwardSyncFromAt,
        forwardSyncedAt: input.forwardSyncedAt ?? null,
        backwardSyncFromAt: null,
        backwardSyncedAt: null,
        errorCount: input.errorCount,
        lastError: input.lastError
    });

const seedFailedBackwardSync = (accountId: number): SyncEntityInterface =>
    seed.sync({
        accountId,
        token: SHARED_OLD_TOKEN,
        provider: ExternalSourceEnum.BINANCE,
        mode: SyncModeEnum.BACKWARD,
        status: SyncStatusEnum.FAILED,
        forwardSyncFromAt: SHARED_FORWARD_SYNC_FROM_AT,
        forwardSyncedAt: SHARED_FORWARD_SYNCED_AT,
        backwardSyncFromAt: SHARED_BACKWARD_SYNC_FROM_AT,
        backwardSyncedAt: SHARED_BACKWARD_SYNCED_AT,
        errorCount: 4,
        lastError: 'shared failure'
    });

const markSyncDeleted = (syncId: number): void => {
    testDb
        .update(SyncEntityTable)
        .set({ deletedAt: new Date('2026-03-04T10:00:00.000Z') })
        .where(eq(SyncEntityTable.id, syncId))
        .run();
};

const seedBinanceAccounts = (): BinanceAccountsInterface => ({
    crossProviderAccount: seedMonobankAccount('monobank-same-binance-token'),
    deletedAccount: seedBinanceAccount('SOL'),
    disabledAccount: seedBinanceAccount('ADA'),
    selectedAccount: seedBinanceAccount('BTC'),
    separateAccount: seedBinanceAccount('BNB'),
    sharedAccount: seedBinanceAccount('ETH')
});

const seedBinanceSyncs = (accounts: BinanceAccountsInterface): BinanceSyncsInterface => ({
    crossProviderSync: seedFailedForwardSync({
        accountId: accounts.crossProviderAccount.id,
        errorCount: 8,
        forwardSyncFromAt: CROSS_PROVIDER_FORWARD_SYNC_FROM_AT,
        lastError: 'cross provider failure',
        provider: ExternalSourceEnum.MONOBANK,
        token: SHARED_OLD_TOKEN
    }),
    deletedSync: seedFailedForwardSync({
        accountId: accounts.deletedAccount.id,
        errorCount: 7,
        forwardSyncFromAt: DELETED_FORWARD_SYNC_FROM_AT,
        lastError: 'deleted failure',
        provider: ExternalSourceEnum.BINANCE,
        token: SHARED_OLD_TOKEN
    }),
    disabledSync: seedFailedForwardSync({
        accountId: accounts.disabledAccount.id,
        enabled: false,
        errorCount: 6,
        forwardSyncFromAt: DISABLED_FORWARD_SYNC_FROM_AT,
        lastError: 'disabled failure',
        provider: ExternalSourceEnum.BINANCE,
        token: SHARED_OLD_TOKEN
    }),
    selectedSync: seedFailedForwardSync({
        accountId: accounts.selectedAccount.id,
        errorCount: 3,
        forwardSyncedAt: SELECTED_FORWARD_SYNCED_AT,
        forwardSyncFromAt: SELECTED_FORWARD_SYNC_FROM_AT,
        lastError: 'selected failure',
        provider: ExternalSourceEnum.BINANCE,
        token: SHARED_OLD_TOKEN
    }),
    separateSync: seedFailedForwardSync({
        accountId: accounts.separateAccount.id,
        errorCount: 5,
        forwardSyncedAt: SEPARATE_FORWARD_SYNCED_AT,
        forwardSyncFromAt: SEPARATE_FORWARD_SYNC_FROM_AT,
        lastError: 'separate failure',
        provider: ExternalSourceEnum.BINANCE,
        token: SEPARATE_OLD_TOKEN
    }),
    sharedSync: seedFailedBackwardSync(accounts.sharedAccount.id)
});

const seedBinanceCredentialRotationScenario = (): BinanceRotationScenarioInterface => {
    const accounts = seedBinanceAccounts();

    return { accounts, syncs: seedBinanceSyncs(accounts) };
};

const expectForwardSync = (sync: SyncEntityInterface, expected: ExpectedForwardSyncInterface): void => {
    expect(sync).toMatchObject({
        enabled: expected.enabled,
        errorCount: expected.errorCount,
        lastError: expected.lastError,
        mode: SyncModeEnum.FORWARD,
        status: SyncStatusEnum.FAILED
    });
    expect(sync.forwardSyncFromAt).toEqual(expected.forwardSyncFromAt);
    expect(sync.forwardSyncedAt).toEqual(expected.forwardSyncedAt);
    expect(sync.backwardSyncFromAt).toBeNull();
    expect(sync.backwardSyncedAt).toBeNull();
};

const expectBackwardSyncUpdated = (sync: SyncEntityInterface): void => {
    expect(sync).toMatchObject({
        errorCount: 0,
        lastError: null,
        mode: SyncModeEnum.BACKWARD,
        status: SyncStatusEnum.FAILED
    });
    expect(sync.forwardSyncFromAt).toEqual(SHARED_FORWARD_SYNC_FROM_AT);
    expect(sync.forwardSyncedAt).toEqual(SHARED_FORWARD_SYNCED_AT);
    expect(sync.backwardSyncFromAt).toEqual(SHARED_BACKWARD_SYNC_FROM_AT);
    expect(sync.backwardSyncedAt).toEqual(SHARED_BACKWARD_SYNCED_AT);
};

const fetchBinanceUpdatedSyncs = (syncs: BinanceSyncsInterface): BinanceSyncsInterface => ({
    crossProviderSync: fetchSyncById(syncs.crossProviderSync.id),
    deletedSync: fetchSyncById(syncs.deletedSync.id),
    disabledSync: fetchSyncById(syncs.disabledSync.id),
    selectedSync: fetchSyncById(syncs.selectedSync.id),
    separateSync: fetchSyncById(syncs.separateSync.id),
    sharedSync: fetchSyncById(syncs.sharedSync.id)
});

const expectUpdatedBinanceGroup = (syncs: BinanceSyncsInterface): void => {
    expectForwardSync(syncs.selectedSync, {
        enabled: true,
        errorCount: 0,
        forwardSyncedAt: SELECTED_FORWARD_SYNCED_AT,
        forwardSyncFromAt: SELECTED_FORWARD_SYNC_FROM_AT,
        lastError: null
    });
    expectBackwardSyncUpdated(syncs.sharedSync);
    expectForwardSync(syncs.disabledSync, {
        enabled: false,
        errorCount: 0,
        forwardSyncedAt: null,
        forwardSyncFromAt: DISABLED_FORWARD_SYNC_FROM_AT,
        lastError: null
    });
};

const expectExcludedBinanceRows = (syncs: BinanceSyncsInterface): void => {
    expectForwardSync(syncs.separateSync, {
        enabled: true,
        errorCount: 5,
        forwardSyncedAt: SEPARATE_FORWARD_SYNCED_AT,
        forwardSyncFromAt: SEPARATE_FORWARD_SYNC_FROM_AT,
        lastError: 'separate failure'
    });
    expectForwardSync(syncs.deletedSync, {
        enabled: true,
        errorCount: 7,
        forwardSyncedAt: null,
        forwardSyncFromAt: DELETED_FORWARD_SYNC_FROM_AT,
        lastError: 'deleted failure'
    });
    expectForwardSync(syncs.crossProviderSync, {
        enabled: true,
        errorCount: 8,
        forwardSyncedAt: null,
        forwardSyncFromAt: CROSS_PROVIDER_FORWARD_SYNC_FROM_AT,
        lastError: 'cross provider failure'
    });
};

const expectRotatedIntegrationTokens = (accounts: BinanceAccountsInterface): void => {
    expect(fetchAccountIntegrationToken(accounts.selectedAccount.id)).toBe(NEW_TOKEN);
    expect(fetchAccountIntegrationToken(accounts.sharedAccount.id)).toBe(NEW_TOKEN);
    expect(fetchAccountIntegrationToken(accounts.disabledAccount.id)).toBe(NEW_TOKEN);
    expect(fetchAccountIntegrationToken(accounts.separateAccount.id)).toBe(SEPARATE_OLD_TOKEN);
    expect(fetchAccountIntegrationToken(accounts.crossProviderAccount.id)).toBe(SHARED_OLD_TOKEN);
};

const expectBinanceCredentialRotationScenario = (scenario: BinanceRotationScenarioInterface): void => {
    const syncs = fetchBinanceUpdatedSyncs(scenario.syncs);

    expectRotatedIntegrationTokens(scenario.accounts);
    expectUpdatedBinanceGroup(syncs);
    expectExcludedBinanceRows(syncs);
};

describe('Binance credential rotation', () => {
    it('rotates the shared integration token and clears every non-deleted sync in the credential group', async () => {
        const scenario = seedBinanceCredentialRotationScenario();

        markSyncDeleted(scenario.syncs.deletedSync.id);
        await binanceSyncService.updateAccountToken(scenario.accounts.selectedAccount.id, NEW_TOKEN);
        expectBinanceCredentialRotationScenario(scenario);
    });
});
