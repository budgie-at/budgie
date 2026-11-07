import { assertStoredBalancesMatchLedger, makeTestDbLayer } from '@budgie-at/test-kit';
import { CloudSyncRestorePhaseEnum, ICloudParticipantRole, ICloudSyncScope } from '@budgie/cloud-sync';
import {
    Db,
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SyncDatabaseScopeEnum,
    SyncIdentityRepository,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    FakeCloudTransport,
    testDb,
    countHouseholdRows,
    HOUSEHOLD_CLOUD_ZONE,
    joinMember,
    OWNER_RECORD_NAME,
    participantsFor,
    readPersonalBalances,
    seedHouseholdLedger,
    fetchedEvent,
    makeSyncServiceContext,
    metaWith,
    syncService
} from '../../harness';

import type { DB } from '@budgie/contracts';

const startRestore = (database: DB, role: SyncZoneRoleEnum) => {
    const context = makeSyncServiceContext(database);

    context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };

    return {
        context,
        run: Effect.gen(function* () {
            const registry = yield* SyncZoneRegistryRepository;
            const service = yield* syncService;
            const identity = yield* SyncIdentityRepository;

            yield* registry.upsert({
                zoneLabel: HOUSEHOLD_SYNC_ZONE,
                zoneName: HOUSEHOLD_CLOUD_ZONE,
                ownerName: role === SyncZoneRoleEnum.OWNER ? '__defaultOwner__' : OWNER_RECORD_NAME,
                databaseScope: role === SyncZoneRoleEnum.OWNER ? SyncDatabaseScopeEnum.PRIVATE : SyncDatabaseScopeEnum.SHARED,
                role
            });
            context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
            yield* service.reconfigure;
            context.transport.behavior.zoneInventory = (yield* database.$client.unsafe<{
                readonly recordName: string;
                readonly recordType: string;
            }>(`SELECT sync_id AS recordName, record_type AS recordType FROM sync_record WHERE sync_zone = ?`, [PERSONAL_SYNC_ZONE])).map(
                ({ recordName, recordType }) => ({ recordName, recordType })
            );
            yield* service.handleFetchedChanges(fetchedEvent([metaWith(yield* identity.ensureLineageId())]));
            yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

            return service;
        })
    };
};

describe('cloud-sync/household restore', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('participant restores a backup', it => {
        it.effect('reconciles household rows against the shared zone inventory once the shared fetch ends', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;

                yield* joinMember(memberDb, new FakeCloudTransport());

                const restore = startRestore(memberDb, SyncZoneRoleEnum.PARTICIPANT);

                restore.context.transport.behavior.participants = participantsFor(
                    ICloudParticipantRole.OWNER,
                    ICloudParticipantRole.PRIVATE_USER
                );
                restore.context.transport.behavior.sharedZoneInventory = [];

                yield* restore.context.run(
                    Effect.gen(function* () {
                        const service = yield* restore.run;

                        expect(restore.context.transport.calls.sharedStarted).toEqual([null]);
                        expect(yield* countHouseholdRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(1);

                        expect(restore.context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                        const sentBefore = restore.context.transport.calls.sharedSavedBatches.length;
                        yield* service.drain;
                        expect(restore.context.transport.calls.sharedSavedBatches).toHaveLength(sentBefore);
                        restore.context.transport.behavior.isInventoryFailing = true;
                        yield* service.handleDidFetch({ scope: ICloudSyncScope.SHARED });
                        expect(restore.context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                        expect(yield* countHouseholdRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(1);
                        restore.context.transport.behavior.isInventoryFailing = false;
                        yield* service.handleDidFetch({ scope: ICloudSyncScope.SHARED });
                        expect(restore.context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                    })
                );

                expect(yield* countHouseholdRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(0);
                expect(yield* countHouseholdRows(memberDb, 'transactions', HOUSEHOLD_SYNC_ZONE)).toBe(0);
                yield* assertStoredBalancesMatchLedger(memberDb);
            })
        );
    });

    it.effect('keeps the owner restore durable and uploads gated until household inventory retry succeeds', () =>
        Effect.gen(function* () {
            yield* seedHouseholdLedger(testDb);
            const restore = startRestore(testDb, SyncZoneRoleEnum.OWNER);
            restore.context.transport.behavior.participants = participantsFor(
                ICloudParticipantRole.OWNER,
                ICloudParticipantRole.PRIVATE_USER
            );
            restore.context.transport.behavior.failingInventoryZone = HOUSEHOLD_CLOUD_ZONE;
            yield* restore.context.run(
                Effect.gen(function* () {
                    const service = yield* restore.run;
                    expect(restore.context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                    const batches = restore.context.transport.calls.savedBatches.length;
                    yield* service.drain;
                    expect(restore.context.transport.calls.savedBatches).toHaveLength(batches);
                    restore.context.transport.behavior.failingInventoryZone = null;
                    yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });
                    expect(restore.context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                })
            );
            yield* assertStoredBalancesMatchLedger(testDb);
        })
    );

    it.effect('turns the owner household into a personal copy when the restored iCloud no longer holds the share', () =>
        Effect.gen(function* () {
            yield* seedHouseholdLedger(testDb);

            const restore = startRestore(testDb, SyncZoneRoleEnum.OWNER);

            restore.context.transport.behavior.participants = [];

            yield* restore.context.run(
                Effect.gen(function* () {
                    const registry = yield* SyncZoneRegistryRepository;

                    yield* restore.run;

                    expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeUndefined();
                })
            );

            expect(yield* countHouseholdRows(testDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(0);
            expect((yield* readPersonalBalances(testDb)).some(({ title }) => title === 'Household joint')).toBe(true);
            expect(restore.context.transport.calls.deletedZones).toEqual([HOUSEHOLD_CLOUD_ZONE]);
            yield* assertStoredBalancesMatchLedger(testDb);
        })
    );
});
