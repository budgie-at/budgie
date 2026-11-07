import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { householdStateAtom } from '@app/household/constant/household-state-atom.constant';
import { makeTestDbLayer, resetTestDb } from '@budgie-at/test-kit';
import { HouseholdRoleEnum } from '@budgie/cloud-sync';
import { Db, SyncDatabaseScopeEnum, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { HOUSEHOLD_CLOUD_ZONE, OWNER_RECORD_NAME } from './household-harness';
import { discoverHouseholdEntry } from './household-tests-shared';
import { makeSyncServiceContext } from './sync-service-harness';

describe('cloud-sync/household discovery', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member device', it => {
        it.effect('registers a household found in the shared database without a share event', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;

                yield* resetTestDb(memberDb);

                const member = makeSyncServiceContext(memberDb);

                member.transport.behavior.joinedHousehold = { zoneName: HOUSEHOLD_CLOUD_ZONE, ownerName: OWNER_RECORD_NAME };

                const entry = yield* discoverHouseholdEntry(member);

                expect(entry?.role).toBe(SyncZoneRoleEnum.PARTICIPANT);
                expect(entry?.databaseScope).toBe(SyncDatabaseScopeEnum.SHARED);
                expect(entry?.ownerName).toBe(OWNER_RECORD_NAME);

                expect(appAtomRegistry.get(householdStateAtom).role).toBe(HouseholdRoleEnum.MEMBER);
            })
        );
    });

    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('organizer second device', it => {
        it.effect('registers an owned shared household as OWNER', () =>
            Effect.gen(function* () {
                const db = yield* Db;

                yield* resetTestDb(db);

                const device = makeSyncServiceContext(db);

                device.transport.behavior.ownedHousehold = { zoneName: HOUSEHOLD_CLOUD_ZONE, shareRecordName: 'cloudkit.zoneshare' };

                const entry = yield* discoverHouseholdEntry(device);

                expect(entry?.role).toBe(SyncZoneRoleEnum.OWNER);
                expect(entry?.databaseScope).toBe(SyncDatabaseScopeEnum.PRIVATE);
            })
        );

        it.effect('does not register an owned zone without a share', () =>
            Effect.gen(function* () {
                const db = yield* Db;

                yield* resetTestDb(db);

                const device = makeSyncServiceContext(db);

                expect(yield* discoverHouseholdEntry(device)).toBeUndefined();
            })
        );
    });
});
