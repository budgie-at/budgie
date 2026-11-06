import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { CloudSyncRestorePhaseEnum } from '@app/cloud-sync/enum/cloud-sync-restore-phase.enum';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { householdStateAtom } from '@app/household/constant/household-state-atom.constant';
import { HouseholdRoleEnum } from '@app/household/enum/household-role.enum';
import { FakeCloudTransport, makeTestDbLayer } from '@budgie-at/test-kit';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncDatabaseScopeEnum, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { ICloudParticipantRole } from '../../../../../packages/app/modules/icloud';

import { expectBalancesMatchLedger } from './apply-harness';
import {
    accessLostEvent,
    countRows,
    HOUSEHOLD_CLOUD_ZONE,
    joinMember,
    MEMBER_ACCOUNT,
    OWNER_RECORD_NAME,
    participantsFor,
    readPersonalBalances,
    shareAcceptedEvent
} from './household-harness';
import { makeSyncServiceContext } from './sync-service-harness';

import type { DB } from '@budgie/contracts';

const countHouseholdRows = (database: DB) =>
    Effect.forEach(
        ['accounts', 'transactions', 'transaction_entries', 'sync_record', 'sync_outbox'],
        tableName => countRows(database, tableName, HOUSEHOLD_SYNC_ZONE),
        { concurrency: 1 }
    );

describe('cloud-sync/household removal', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('owner removes the member', it => {
        it.effect('deletes the household rows on the next sync and leaves personal balances unchanged', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* joinMember(memberDb, cloud);

                const personalBefore = yield* readPersonalBalances(memberDb);

                expect((yield* countHouseholdRows(memberDb)).slice(0, 3)).toEqual([1, 1, 1]);

                cloud.revokeShare(HOUSEHOLD_SYNC_ZONE, MEMBER_ACCOUNT);

                expect(cloud.takeLostZones(MEMBER_ACCOUNT)).toEqual([HOUSEHOLD_SYNC_ZONE]);

                const member = makeSyncServiceContext(memberDb);
                const lostEvent = accessLostEvent();

                yield* member.run(
                    Effect.gen(function* () {
                        const service = yield* CloudSyncService;
                        const registry = yield* SyncZoneRegistryRepository;

                        yield* service.reconfigure();
                        yield* service.handleShareAccepted(shareAcceptedEvent());
                        yield* service.handleZoneChange(lostEvent);

                        expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeUndefined();
                    })
                );

                expect(yield* countHouseholdRows(memberDb)).toEqual([0, 0, 0, 0, 0]);
                expect(yield* countRows(memberDb, 'accounts')).toBe(1);
                expect(yield* countRows(memberDb, 'account_balances')).toBe(1);
                expect(yield* readPersonalBalances(memberDb)).toEqual(personalBefore);
                expect(member.transport.calls.sharedStopped).toBe(1);
                expect(member.transport.calls.confirmed).toContain(lostEvent.batchId);
                expect(appAtomRegistry.get(householdStateAtom).role).toBe(HouseholdRoleEnum.NONE);
                yield* expectBalancesMatchLedger(memberDb);
            })
        );
    });

    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('removed member restores a backup', it => {
        it.effect('drops the household rows whose share is not accepted on this device', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;

                yield* joinMember(memberDb, new FakeCloudTransport());

                const personalBefore = yield* readPersonalBalances(memberDb);
                const member = makeSyncServiceContext(memberDb);

                member.store.holder.state = { ...member.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
                member.transport.behavior.participants = [];

                yield* member.run(
                    Effect.gen(function* () {
                        const registry = yield* SyncZoneRegistryRepository;
                        const service = yield* CloudSyncService;

                        yield* registry.upsert({
                            zoneLabel: HOUSEHOLD_SYNC_ZONE,
                            zoneName: HOUSEHOLD_CLOUD_ZONE,
                            ownerName: OWNER_RECORD_NAME,
                            databaseScope: SyncDatabaseScopeEnum.SHARED,
                            role: SyncZoneRoleEnum.PARTICIPANT
                        });
                        yield* service.reconfigure();

                        expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeUndefined();
                    })
                );

                expect(member.transport.calls.sharedStarted).toEqual([]);
                expect(yield* countHouseholdRows(memberDb)).toEqual([0, 0, 0, 0, 0]);
                expect(yield* readPersonalBalances(memberDb)).toEqual(personalBefore);
                yield* expectBalancesMatchLedger(memberDb);
            })
        );

        it.effect('keeps the household rows and refetches them when the share is accepted on this device', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;

                yield* joinMember(memberDb, new FakeCloudTransport());

                const member = makeSyncServiceContext(memberDb);

                member.store.holder.state = { ...member.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
                member.transport.behavior.participants = participantsFor(ICloudParticipantRole.OWNER, ICloudParticipantRole.PRIVATE_USER);

                yield* member.run(
                    Effect.gen(function* () {
                        const registry = yield* SyncZoneRegistryRepository;
                        const service = yield* CloudSyncService;

                        yield* registry.upsert({
                            zoneLabel: HOUSEHOLD_SYNC_ZONE,
                            zoneName: HOUSEHOLD_CLOUD_ZONE,
                            ownerName: OWNER_RECORD_NAME,
                            databaseScope: SyncDatabaseScopeEnum.SHARED,
                            role: SyncZoneRoleEnum.PARTICIPANT
                        });
                        yield* service.reconfigure();
                    })
                );

                expect(member.transport.calls.sharedStarted).toEqual([null]);
                expect((yield* countHouseholdRows(memberDb)).slice(0, 3)).toEqual([1, 1, 1]);
            })
        );
    });
});
