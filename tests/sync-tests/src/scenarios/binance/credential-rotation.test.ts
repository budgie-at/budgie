import { AccountTypeEnum, ExternalSourceEnum, SyncEntityTable, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountIntegrationToken, fetchSyncById, seed, seedCryptoInstrument, testDb, TestLayer } from '../../harness';

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

const seedBinanceAccount = (asset: string) =>
    Effect.gen(function* () {
        const instrument = yield* seedCryptoInstrument(asset);

        return yield* seed.account({
            externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset }),
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: instrument.id
        });
    });

const seedMonobankAccount = (externalId: string) =>
    Effect.gen(function* () {
        return yield* seed.account({
            externalId,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: AccountTypeEnum.BANK_SYNC
        });
    });

const seedFailedForwardSync = (input: SeedFailedForwardSyncInputInterface) =>
    Effect.gen(function* () {
        return yield* seed.sync({
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
    });

const seedFailedBackwardSync = (accountId: number) =>
    Effect.gen(function* () {
        return yield* seed.sync({
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
    });

const markSyncDeleted = (syncId: number) =>
    Effect.gen(function* () {
        yield* testDb
            .update(SyncEntityTable)
            .set({ deletedAt: new Date('2026-03-04T10:00:00.000Z') })
            .where(eq(SyncEntityTable.id, syncId));
    });

const seedBinanceAccounts = () =>
    Effect.gen(function* () {
        return {
            crossProviderAccount: yield* seedMonobankAccount('monobank-same-binance-token'),
            deletedAccount: yield* seedBinanceAccount('SOL'),
            disabledAccount: yield* seedBinanceAccount('ADA'),
            selectedAccount: yield* seedBinanceAccount('BTC'),
            separateAccount: yield* seedBinanceAccount('BNB'),
            sharedAccount: yield* seedBinanceAccount('ETH')
        };
    });

const seedBinanceSyncs = (accounts: BinanceAccountsInterface) =>
    Effect.gen(function* () {
        return {
            crossProviderSync: yield* seedFailedForwardSync({
                accountId: accounts.crossProviderAccount.id,
                errorCount: 8,
                forwardSyncFromAt: CROSS_PROVIDER_FORWARD_SYNC_FROM_AT,
                lastError: 'cross provider failure',
                provider: ExternalSourceEnum.MONOBANK,
                token: SHARED_OLD_TOKEN
            }),
            deletedSync: yield* seedFailedForwardSync({
                accountId: accounts.deletedAccount.id,
                errorCount: 7,
                forwardSyncFromAt: DELETED_FORWARD_SYNC_FROM_AT,
                lastError: 'deleted failure',
                provider: ExternalSourceEnum.BINANCE,
                token: SHARED_OLD_TOKEN
            }),
            disabledSync: yield* seedFailedForwardSync({
                accountId: accounts.disabledAccount.id,
                enabled: false,
                errorCount: 6,
                forwardSyncFromAt: DISABLED_FORWARD_SYNC_FROM_AT,
                lastError: 'disabled failure',
                provider: ExternalSourceEnum.BINANCE,
                token: SHARED_OLD_TOKEN
            }),
            selectedSync: yield* seedFailedForwardSync({
                accountId: accounts.selectedAccount.id,
                errorCount: 3,
                forwardSyncedAt: SELECTED_FORWARD_SYNCED_AT,
                forwardSyncFromAt: SELECTED_FORWARD_SYNC_FROM_AT,
                lastError: 'selected failure',
                provider: ExternalSourceEnum.BINANCE,
                token: SHARED_OLD_TOKEN
            }),
            separateSync: yield* seedFailedForwardSync({
                accountId: accounts.separateAccount.id,
                errorCount: 5,
                forwardSyncedAt: SEPARATE_FORWARD_SYNCED_AT,
                forwardSyncFromAt: SEPARATE_FORWARD_SYNC_FROM_AT,
                lastError: 'separate failure',
                provider: ExternalSourceEnum.BINANCE,
                token: SEPARATE_OLD_TOKEN
            }),
            sharedSync: yield* seedFailedBackwardSync(accounts.sharedAccount.id)
        };
    });

const seedBinanceCredentialRotationScenario = () =>
    Effect.gen(function* () {
        const accounts = yield* seedBinanceAccounts();

        return { accounts, syncs: yield* seedBinanceSyncs(accounts) };
    });

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

const fetchBinanceUpdatedSyncs = (syncs: BinanceSyncsInterface) =>
    Effect.gen(function* () {
        return {
            crossProviderSync: yield* fetchSyncById(syncs.crossProviderSync.id),
            deletedSync: yield* fetchSyncById(syncs.deletedSync.id),
            disabledSync: yield* fetchSyncById(syncs.disabledSync.id),
            selectedSync: yield* fetchSyncById(syncs.selectedSync.id),
            separateSync: yield* fetchSyncById(syncs.separateSync.id),
            sharedSync: yield* fetchSyncById(syncs.sharedSync.id)
        };
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

const expectRotatedIntegrationTokens = (accounts: BinanceAccountsInterface) =>
    Effect.gen(function* () {
        expect(yield* fetchAccountIntegrationToken(accounts.selectedAccount.id)).toBe(NEW_TOKEN);
        expect(yield* fetchAccountIntegrationToken(accounts.sharedAccount.id)).toBe(NEW_TOKEN);
        expect(yield* fetchAccountIntegrationToken(accounts.disabledAccount.id)).toBe(NEW_TOKEN);
        expect(yield* fetchAccountIntegrationToken(accounts.separateAccount.id)).toBe(SEPARATE_OLD_TOKEN);
        expect(yield* fetchAccountIntegrationToken(accounts.crossProviderAccount.id)).toBe(SHARED_OLD_TOKEN);
    });

const expectBinanceCredentialRotationScenario = (scenario: BinanceRotationScenarioInterface) =>
    Effect.gen(function* () {
        const syncs = yield* fetchBinanceUpdatedSyncs(scenario.syncs);

        yield* expectRotatedIntegrationTokens(scenario.accounts);
        expectUpdatedBinanceGroup(syncs);
        expectExcludedBinanceRows(syncs);
    });

describe('Binance credential rotation', () => {
    it.effect('rotates the shared integration token and clears every non-deleted sync in the credential group', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const scenario = yield* seedBinanceCredentialRotationScenario();

            yield* markSyncDeleted(scenario.syncs.deletedSync.id);
            yield* binanceSyncService.updateAccountToken(scenario.accounts.selectedAccount.id, NEW_TOKEN);
            yield* expectBinanceCredentialRotationScenario(scenario);
        }).pipe(Effect.provide(TestLayer))
    );
});
