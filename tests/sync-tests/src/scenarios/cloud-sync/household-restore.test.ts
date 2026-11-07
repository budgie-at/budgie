import { CloudSyncRestorePhaseEnum } from '@app/cloud-sync/enum/cloud-sync-restore-phase.enum';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { FakeCloudTransport, makeTestDbLayer } from '@budgie-at/test-kit';
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

import { ICloudParticipantRole, ICloudSyncScope } from '../../../../../packages/app/modules/icloud';
import { testDb } from '../../harness';

import { expectBalancesMatchLedger } from './apply-harness';
import {
    countRows,
    HOUSEHOLD_CLOUD_ZONE,
    joinMember,
    OWNER_RECORD_NAME,
    participantsFor,
    readPersonalBalances,
    seedHouseholdLedger
} from './household-harness';
import { fetchedEvent, makeSyncServiceContext, metaWith } from './sync-service-harness';

import type { DB } from '@budgie/contracts';

const startRestore = (database: DB, role: SyncZoneRoleEnum) => {
    const context = makeSyncServiceContext(database);

    context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };

    return {
        context,
        run: Effect.gen(function* () {
            const registry = yield* SyncZoneRegistryRepository;
            const service = yield* CloudSyncService;
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
                        expect(yield* countRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(1);

                        yield* service.handleDidFetch({ scope: ICloudSyncScope.SHARED });
                    })
                );

                expect(yield* countRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(0);
                expect(yield* countRows(memberDb, 'transactions', HOUSEHOLD_SYNC_ZONE)).toBe(0);
                yield* expectBalancesMatchLedger(memberDb);
            })
        );
    });

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

            expect(yield* countRows(testDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(0);
            expect((yield* readPersonalBalances(testDb)).some(({ title }) => title === 'Household joint')).toBe(true);
            expect(restore.context.transport.calls.deletedZones).toEqual([HOUSEHOLD_CLOUD_ZONE]);
            yield* expectBalancesMatchLedger(testDb);
        })
    );
});
