import { TestSeedService, encodeJson, resetTestDb } from '@budgie-at/test-kit';
import {
    SYNC_RECORD_SCHEMA_VERSION,
    ICloudParticipantAcceptanceStatus,
    ICloudParticipantPermission,
    ICloudParticipantRole,
    ICloudShareOutcome,
    ICloudSyncScope,
    ICloudZoneChangeReason
} from '@budgie/cloud-sync';
import { HOUSEHOLD_SYNC_ZONE, SyncRecordRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { onDevice, pullDevice, refreshAllBalances } from './apply-harness';
import { encodeAllRecords, loadSyncState } from './record-mapping-harness';

import type { FakeCloudTransport } from '../../harness';
import type { ICloudShareAcceptedEvent, ICloudShareParticipant, ICloudZoneChangeEvent } from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

export const OWNER_RECORD_NAME = 'owner-user-record';
export const HOUSEHOLD_CLOUD_ZONE = 'Household';
export const OWNER_ACCOUNT = 'owner-apple-id';
export const MEMBER_ACCOUNT = 'member-apple-id';
export const MEMBER_DEVICE = 'member-device';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');

export const shareAcceptedEvent = (): ICloudShareAcceptedEvent => ({
    zoneName: HOUSEHOLD_CLOUD_ZONE,
    ownerName: OWNER_RECORD_NAME,
    outcome: ICloudShareOutcome.ACCEPTED
});

export const accessLostEvent = (): ICloudZoneChangeEvent => ({
    scope: ICloudSyncScope.SHARED,
    batchId: `zone-${Math.random()}`,
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

export const seedPersonalLedger = (database: DB, title: string, amount: number) =>
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

        yield* database.$client.unsafe('UPDATE accounts SET sync_zone = ? WHERE id = ?', [HOUSEHOLD_SYNC_ZONE, account.id]);
        yield* database.$client.unsafe('UPDATE transactions SET sync_zone = ? WHERE id = ?', [HOUSEHOLD_SYNC_ZONE, expense.id]);
        yield* database.$client.unsafe('UPDATE transaction_entries SET sync_zone = ? WHERE transaction_id = ?', [
            HOUSEHOLD_SYNC_ZONE,
            expense.id
        ]);
        yield* refreshAllBalances(database);

        return { account, expense };
    });

export const pushHouseholdZone = (database: DB, cloud: FakeCloudTransport) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const records = (yield* encodeAllRecords(yield* loadSyncState(database))).filter(({ zone }) => zone === HOUSEHOLD_SYNC_ZONE);
            const recordRepository = yield* SyncRecordRepository;
            const systemFields = cloud.upload(records);

            for (const [index, record] of records.entries()) {
                yield* recordRepository.upsert({
                    syncZone: record.zone,
                    syncId: record.recordName,
                    recordType: record.recordType,
                    systemFields: systemFields[index],
                    payload: encodeJson(record),
                    schemaVersion: SYNC_RECORD_SCHEMA_VERSION
                });
            }

            yield* database.$client.unsafe('DELETE FROM sync_outbox WHERE sync_zone = ?', [HOUSEHOLD_SYNC_ZONE]);

            return records.length;
        })
    );

export const countRows = (database: DB, tableName: string, zone?: string) =>
    database.$client
        .unsafe<{ readonly total: number }>(
            zone === undefined
                ? `SELECT COUNT(*) AS total FROM ${tableName}`
                : `SELECT COUNT(*) AS total FROM ${tableName} WHERE sync_zone = ?`,
            zone === undefined ? [] : [zone]
        )
        .pipe(Effect.map(([row]) => row.total));

export const readPersonalBalances = (database: DB) =>
    database.$client.unsafe<{ readonly title: string; readonly amount: number }>(
        `SELECT a.title AS title, b.amount AS amount FROM accounts a INNER JOIN account_balances b ON b.account_id = a.id
        WHERE a.sync_zone = 'personal' ORDER BY a.title`
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
