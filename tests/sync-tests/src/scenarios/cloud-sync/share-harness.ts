import {
    HouseholdShareService,
    SyncApplyService,
    SyncDatabaseScopeEnum,
    SyncUploadService,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isRecord, isString } from '@rnw-community/shared';

import { resetTestDb } from '@budgie-at/test-kit';

import { testDb } from '../../harness';

import { deviceLayer } from './apply-harness';

import type { FakeCloudDeliveryOptionsInterface, FakeCloudTransport } from '@budgie-at/test-kit';
import type { DB, SyncApplyResultInterface, SyncUploadAcknowledgementInterface } from '@budgie/contracts';

export const PERSONAL_ZONE = 'personal';
export const HOUSEHOLD_ZONE = 'household';
const UPLOAD_LIMIT = 10_000;

const shareLayer = Layer.mergeAll(deviceLayer, HouseholdShareService.layer, SyncUploadService.layer, SyncZoneRegistryRepository.layer);

export const onShareDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<A, E, Db | SyncApplyService | SyncUploadService | HouseholdShareService | SyncZoneRegistryRepository>
) => effect.pipe(Effect.provide(shareLayer), Effect.provideService(Db, database));

export const joinHousehold = (database: DB, role: SyncZoneRoleEnum, ownerName: string) =>
    onShareDevice(
        database,
        Effect.gen(function* () {
            const registry = yield* SyncZoneRegistryRepository;

            yield* registry.upsert({
                zoneLabel: PERSONAL_ZONE,
                zoneName: 'personal-zone',
                ownerName,
                databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                role: SyncZoneRoleEnum.OWNER
            });
            yield* registry.upsert({
                zoneLabel: HOUSEHOLD_ZONE,
                zoneName: 'household-zone',
                ownerName,
                databaseScope: role === SyncZoneRoleEnum.OWNER ? SyncDatabaseScopeEnum.PRIVATE : SyncDatabaseScopeEnum.SHARED,
                role
            });
        })
    );

export interface ShareCloudsInterface {
    readonly personal: FakeCloudTransport;
    readonly household: FakeCloudTransport;
}

export const uploadDevice = (database: DB, clouds: ShareCloudsInterface) =>
    onShareDevice(
        database,
        Effect.gen(function* () {
            const uploadService = yield* SyncUploadService;
            const outbox = yield* database.$client.unsafe<{ readonly recordType: string; readonly syncZone: string; readonly syncId: string }>(
                `SELECT record_type AS recordType, sync_zone AS syncZone, sync_id AS syncId FROM sync_outbox`
            );
            const recordTypes = new Map(outbox.map(row => [`${row.syncZone}|${row.syncId}`, row.recordType]));
            const batch = yield* uploadService.pending(UPLOAD_LIMIT);

            if (batch.rejections.length > 0) {
                return yield* Effect.die(`upload rejected: ${JSON.stringify(batch.rejections)}`);
            }

            const acknowledgements: SyncUploadAcknowledgementInterface[] = [];

            const cloudFor = (zone: string): FakeCloudTransport => (zone === HOUSEHOLD_ZONE ? clouds.household : clouds.personal);

            for (const save of batch.saves) {
                const systemFields = save.records.map(record => cloudFor(record.zone).upload([record])[0]);

                for (const target of save.staleTargets) {
                    cloudFor(target.zone).remove('TransactionLeg', target.zone, target.recordName);
                }

                acknowledgements.push({
                    syncZone: save.syncZone,
                    syncId: save.syncId,
                    syncRevision: save.syncRevision,
                    sentRecords: save.records.map((record, index) => ({ record, systemFields: systemFields[index] })),
                    deletedTargets: save.staleTargets
                });
            }

            for (const deletion of batch.deletions) {
                for (const target of deletion.targets) {
                    cloudFor(target.zone).remove(
                        recordTypes.get(`${target.zone}|${target.recordName}`) ?? 'TransactionLeg',
                        target.zone,
                        target.recordName
                    );
                }

                acknowledgements.push({
                    syncZone: deletion.syncZone,
                    syncId: deletion.syncId,
                    syncRevision: deletion.syncRevision,
                    sentRecords: [],
                    deletedTargets: deletion.targets
                });
            }

            yield* uploadService.acknowledge(acknowledgements);

            return batch;
        })
    );

const isInZones = (record: unknown, zones: readonly string[]): boolean => isRecord(record) && isString(record['zone']) && zones.includes(record['zone']);

export const pullZones = (
    database: DB,
    cloud: FakeCloudTransport,
    deviceId: string,
    zones: readonly string[],
    options: FakeCloudDeliveryOptionsInterface = {}
) =>
    onShareDevice(
        database,
        Effect.gen(function* () {
            const applyService = yield* SyncApplyService;
            const results: SyncApplyResultInterface[] = [];

            for (const batch of cloud.pull(deviceId, options)) {
                results.push(
                    yield* applyService.apply({
                        records: batch.records.filter(({ record }) => isInZones(record, zones)),
                        deletions: batch.deletions.filter(({ zone }) => zones.includes(zone))
                    })
                );
            }

            return results;
        })
    );

export const queryRows = <T extends object>(database: DB, sqlText: string, params: readonly (string | number)[] = []) =>
    database.$client.unsafe<T>(sqlText, [...params]);

export const countRows = (database: DB, sqlFrom: string, params: readonly (string | number)[] = []) =>
    queryRows<{ readonly total: number }>(database, `SELECT COUNT(*) AS total FROM ${sqlFrom}`, params).pipe(Effect.map(([row]) => row.total));

export const resetDevice = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;

        yield* client.unsafe(
            `DELETE FROM default_category_translations WHERE category_id IN (SELECT id FROM categories WHERE sync_zone <> '${PERSONAL_ZONE}' OR is_default = 0)`
        );
        yield* client.unsafe(`DELETE FROM categories WHERE sync_zone <> '${PERSONAL_ZONE}' OR is_default = 0`);
        yield* client.unsafe(`UPDATE categories SET title = 'Groceries', title_search = 'groceries' WHERE id = 11`);
        yield* client.unsafe(`UPDATE settings SET household_share_everything = 0`);
    }).pipe(Effect.andThen(resetTestDb(database)));

export const prepareHousehold = (deviceB: DB, memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        yield* resetDevice(testDb);
        yield* resetDevice(deviceB);
        yield* joinHousehold(testDb, SyncZoneRoleEnum.OWNER, 'Alice');
        yield* joinHousehold(deviceB, memberRole, memberRole === SyncZoneRoleEnum.OWNER ? 'Alice' : 'Bob');
    });

export const reconcileDevice = (database: DB) => onShareDevice(database, Effect.flatMap(HouseholdShareService, service => service.reconcile()));
