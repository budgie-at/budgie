import { TestSeedService, resetTestDb } from '@budgie-at/test-kit';
import {
    HouseholdShareService,
    ICLOUD_DEFAULT_OWNER_NAME,
    ICloudParticipantAcceptanceStatus,
    ICloudParticipantPermission,
    ICloudParticipantRole,
    ICloudShareOutcome,
    ICloudSyncScope,
    ICloudZoneChangeReason
} from '@budgie/cloud-sync';
import {
    PERSONAL_SYNC_ZONE,
    HOUSEHOLD_SYNC_ZONE,
    SyncDatabaseScopeEnum,
    SyncZoneRoleEnum,
    SyncZoneRegistryRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

import { pullDevice, refreshAllBalances, uploadDevice } from './apply-harness';
import { OPERATED_AT } from './cloud-fixtures';
import { FakeCloudTransport } from './fake-cloud-transport';
import { onShareDevice } from './share-harness';

import type { ICloudShareAcceptedEvent, ICloudShareParticipant, ICloudZoneChangeEvent } from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

export const OWNER_RECORD_NAME = 'owner-user-record';
export const HOUSEHOLD_CLOUD_ZONE = 'Household';
const OWNER_ACCOUNT = 'owner-apple-id';
export const MEMBER_ACCOUNT = 'member-apple-id';
export const MEMBER_DEVICE = 'member-device';

export const shareAcceptedEvent = (): ICloudShareAcceptedEvent => ({
    zoneName: HOUSEHOLD_CLOUD_ZONE,
    ownerName: OWNER_RECORD_NAME,
    outcome: ICloudShareOutcome.ACCEPTED
});

export const accessLostEvent = (): ICloudZoneChangeEvent => ({
    scope: ICloudSyncScope.SHARED,
    deleted: [{ zoneName: HOUSEHOLD_CLOUD_ZONE, ownerName: OWNER_RECORD_NAME, reason: ICloudZoneChangeReason.ACCESS_LOST }],
    modified: []
});

export const participantsFor = (...roles: readonly ICloudParticipantRole[]): readonly ICloudShareParticipant[] =>
    roles.map((role, index) => ({
        participantId: `participant-${index}`,
        displayName: role === ICloudParticipantRole.OWNER ? 'Owner Person' : `Member ${index}`,
        role,
        acceptanceStatus: ICloudParticipantAcceptanceStatus.ACCEPTED,
        permission: ICloudParticipantPermission.READ_WRITE,
        isCurrentUser: false
    }));

const seedPersonalLedger = (database: DB, title: string, amount: number) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const account = yield* seed.account({ title });

        yield* seed.manualExpense({ accountId: account.id, amount, operatedAt: OPERATED_AT, title: `${title} lunch` });
        yield* refreshAllBalances(database);

        return account;
    });

export const seedHouseholdLedger = (database: DB) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const account = yield* seed.account({ title: 'Household joint' });
        const expense = yield* seed.manualExpense({
            accountId: account.id,
            amount: 12_000_000,
            operatedAt: OPERATED_AT,
            title: 'Groceries run'
        });

        yield* onShareDevice(
            database,
            Effect.gen(function* () {
                yield* (yield* SyncZoneRegistryRepository).upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: HOUSEHOLD_CLOUD_ZONE,
                    ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });
                yield* (yield* HouseholdShareService).shareAccount(account.id);
            })
        );
        yield* refreshAllBalances(database);

        return { account, expense };
    });

export const pushHouseholdZone = (database: DB, cloud: FakeCloudTransport) =>
    uploadDevice(database, { personal: new FakeCloudTransport(), household: cloud });

export const readPersonalBalances = (database: DB) =>
    database.$client.unsafe<{ readonly title: string; readonly amount: number }>(
        `SELECT a.title AS title, b.amount AS amount FROM accounts a INNER JOIN account_balances b ON b.account_id = a.id
        WHERE a.sync_zone = ? ORDER BY a.title`,
        [PERSONAL_SYNC_ZONE]
    );

export const readSyncIds = (database: DB, tableName: string, zone: string) =>
    database.$client
        .unsafe<{ readonly syncId: string }>(`SELECT sync_id AS syncId FROM ${tableName} WHERE sync_zone = ? ORDER BY sync_id`, [zone])
        .pipe(Effect.map(rows => rows.map(({ syncId }) => syncId)));

export const joinMember = (memberDb: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        yield* resetTestDb(memberDb);
        yield* seedHouseholdLedger(testDb);
        yield* seedPersonalLedger(memberDb, 'Member card', 4_000_000);
        yield* pushHouseholdZone(testDb, cloud);
        cloud.shareZone(HOUSEHOLD_SYNC_ZONE, [OWNER_ACCOUNT]);
        cloud.acceptShare(HOUSEHOLD_SYNC_ZONE, MEMBER_ACCOUNT);
        yield* pullDevice(memberDb, cloud, MEMBER_DEVICE, { accountId: MEMBER_ACCOUNT });
    });
