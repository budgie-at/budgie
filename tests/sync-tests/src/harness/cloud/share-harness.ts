import { resetTestDb } from '@budgie-at/test-kit';
import { HouseholdShareService, SyncApplyService, SyncUploadService } from '@budgie/cloud-sync';
import {
    PERSONAL_SYNC_ZONE,
    HOUSEHOLD_SYNC_ZONE,
    Db,
    SyncDatabaseScopeEnum,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isRecord, isString } from '@rnw-community/shared';

import { testDb } from '../scenario/test-db';

import { applyPulledBatches, deviceLayer } from './apply-harness';

import type { FakeCloudDeliveryOptionsInterface } from './fake-cloud-delivery-options.interface';
import type { FakeCloudTransport } from './fake-cloud-transport';
import type { DB } from '@budgie/contracts';

const shareLayer = Layer.mergeAll(deviceLayer, HouseholdShareService.layer, SyncUploadService.layer, SyncZoneRegistryRepository.layer);

export const onShareDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<A, E, Db | SyncApplyService | SyncUploadService | HouseholdShareService | SyncZoneRegistryRepository>
) => effect.pipe(Effect.provide(shareLayer), Effect.provideService(Db, database));

const joinHousehold = (database: DB, role: SyncZoneRoleEnum, ownerName: string) =>
    onShareDevice(
        database,
        Effect.gen(function* () {
            const registry = yield* SyncZoneRegistryRepository;

            yield* registry.upsert({
                zoneLabel: PERSONAL_SYNC_ZONE,
                zoneName: 'personal-zone',
                ownerName,
                databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                role: SyncZoneRoleEnum.OWNER
            });
            yield* registry.upsert({
                zoneLabel: HOUSEHOLD_SYNC_ZONE,
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

const isInZones = (record: unknown, zones: readonly string[]): boolean =>
    isRecord(record) && isString(record['zone']) && zones.includes(record['zone']);

export const pullZones = (
    database: DB,
    cloud: FakeCloudTransport,
    deviceId: string,
    zones: readonly string[],
    options: FakeCloudDeliveryOptionsInterface = {}
) =>
    onShareDevice(
        database,
        applyPulledBatches(cloud, deviceId, options, batch => ({
            records: batch.records.filter(({ record }) => isInZones(record, zones)),
            deletions: batch.deletions.filter(({ zone }) => zones.includes(zone))
        }))
    );

export const queryRows = <T extends object>(database: DB, sqlText: string, params: readonly (string | number)[] = []) =>
    database.$client.unsafe<T>(sqlText, [...params]);

export const countRows = (database: DB, sqlFrom: string, params: readonly (string | number)[] = []) =>
    queryRows<{ readonly total: number }>(database, `SELECT COUNT(*) AS total FROM ${sqlFrom}`, params).pipe(
        Effect.map(([row]) => row.total)
    );

const resetDevice = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;

        yield* client.unsafe(
            `DELETE FROM default_category_translations WHERE category_id IN (SELECT id FROM categories WHERE sync_zone <> '${PERSONAL_SYNC_ZONE}' OR is_default = 0)`
        );
        yield* client.unsafe(`DELETE FROM categories WHERE sync_zone <> '${PERSONAL_SYNC_ZONE}' OR is_default = 0`);
        yield* client.unsafe(`UPDATE categories SET title = 'Groceries', title_search = 'groceries' WHERE id = 11`);
        yield* client.unsafe(`UPDATE settings SET household_share_everything = 0`);
    }).pipe(Effect.andThen(resetTestDb(database)));

export const prepareHousehold = (deviceB: DB, memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        yield* resetDevice(testDb);
        yield* resetDevice(deviceB);
        yield* joinHousehold(testDb, SyncZoneRoleEnum.OWNER, '__defaultOwner__');
        yield* joinHousehold(deviceB, memberRole, memberRole === SyncZoneRoleEnum.OWNER ? '__defaultOwner__' : 'Bob');
    });

export const reconcileDevice = (database: DB) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.reconcile())
    );
