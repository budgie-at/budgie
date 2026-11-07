import { makeTestDbLayer } from '@budgie-at/test-kit';
import { HouseholdShareService } from '@budgie/cloud-sync';
import { Db } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport } from '../../harness';

import { expectBalancesMatchLedger } from './apply-harness';
import { HOUSEHOLD_ZONE, onShareDevice, prepareHousehold, pullZones, queryRows, uploadDevice } from './share-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { DB, SyncZoneRoleEnum } from '@budgie/contracts';

const makeClouds = (): ShareCloudsInterface => ({ personal: new FakeCloudTransport(), household: new FakeCloudTransport() });

const layerShareDevices = () => it.layer(makeTestDbLayer(null), { excludeTestServices: true });

export const shareDevices = layerShareDevices();

export const startHousehold = (memberRole: SyncZoneRoleEnum) =>
    Effect.gen(function* () {
        const deviceB = yield* Db;
        const clouds = makeClouds();

        yield* prepareHousehold(deviceB, memberRole);

        return { deviceB, clouds };
    });

export const shareAccount = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.shareAccount(accountId))
    );

export const shareAndUpload = (database: DB, clouds: ShareCloudsInterface, accountId: number) =>
    Effect.andThen(shareAccount(database, accountId), uploadDevice(database, clouds));

export const pullHousehold = (
    database: DB,
    clouds: ShareCloudsInterface,
    deviceId: string,
    options: Parameters<typeof pullZones>[4] = {}
) => pullZones(database, clouds.household, deviceId, [HOUSEHOLD_ZONE], options);

export const expectNoRejections = (results: readonly { readonly rejected: readonly unknown[] }[]) => {
    expect(results.flatMap(result => result.rejected)).toEqual([]);
};

export const expectLedgers = (...databases: readonly DB[]) =>
    Effect.forEach(databases, database => expectBalancesMatchLedger(database), { discard: true });

export const expectTitleZones = (database: DB, table: string, expected: readonly (readonly [string, string])[]) =>
    Effect.gen(function* () {
        const rows = yield* queryRows(database, `SELECT title, sync_zone FROM ${table} ORDER BY title`);

        expect(rows).toEqual(expected.map(([title, zone]) => ({ title, sync_zone: zone })));
    });
