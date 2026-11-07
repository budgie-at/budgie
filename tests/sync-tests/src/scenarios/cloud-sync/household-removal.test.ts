import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { householdStateAtom } from '@app/household/constant/household-state-atom.constant';
import { makeTestDbLayer } from '@budgie-at/test-kit';
import { CloudSyncRestorePhaseEnum, HouseholdRoleEnum, ICloudParticipantRole } from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncDatabaseScopeEnum, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport } from '../../harness';

import { expectBalancesMatchLedger } from './apply-harness';
import {
    accessLostEvent,
    countRows,
    HOUSEHOLD_CLOUD_ZONE,
    joinMember,
    MEMBER_ACCOUNT,
    OWNER_RECORD_NAME,
    participantsFor,
    readPersonalBalances
} from './household-harness';
import { acceptShareThen } from './household-tests-shared';
import { makeSyncServiceContext, syncService } from './sync-service-harness';

import type { DB } from '@budgie/contracts';

const countHouseholdRows = (database: DB) =>
    Effect.forEach(
        ['accounts', 'transactions', 'transaction_entries', 'sync_record', 'sync_outbox'],
        tableName => countRows(database, tableName, HOUSEHOLD_SYNC_ZONE),
        { concurrency: 1 }
    );

const restoreBackupWithParticipants = (memberDb: DB, participants: ReturnType<typeof participantsFor>) =>
    Effect.gen(function* () {
        const member = makeSyncServiceContext(memberDb);

        member.store.holder.state = { ...member.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
        member.transport.behavior.participants = participants;

        const household = yield* member.run(
            Effect.gen(function* () {
                const registry = yield* SyncZoneRegistryRepository;
                const service = yield* syncService;

                yield* registry.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: HOUSEHOLD_CLOUD_ZONE,
                    ownerName: OWNER_RECORD_NAME,
                    databaseScope: SyncDatabaseScopeEnum.SHARED,
                    role: SyncZoneRoleEnum.PARTICIPANT
                });
                yield* service.reconfigure;

                return yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE);
            })
        );

        return { member, household };
    });

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

                const remaining = yield* acceptShareThen(
                    member,
                    Effect.flatMap(syncService, service => service.handleZoneChange(lostEvent))
                );

                expect(remaining).toBeUndefined();
                expect(yield* countHouseholdRows(memberDb)).toEqual([0, 0, 0, 0, 0]);
                expect(yield* countRows(memberDb, 'accounts')).toBe(1);
                expect(yield* countRows(memberDb, 'account_balances')).toBe(1);
                expect(yield* readPersonalBalances(memberDb)).toEqual(personalBefore);
                expect(member.transport.calls.sharedStopped).toBe(1);
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
                const { member, household } = yield* restoreBackupWithParticipants(memberDb, []);

                expect(household).toBeUndefined();
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

                const { member } = yield* restoreBackupWithParticipants(
                    memberDb,
                    participantsFor(ICloudParticipantRole.OWNER, ICloudParticipantRole.PRIVATE_USER)
                );

                expect(member.transport.calls.sharedStarted).toEqual([null]);
                expect((yield* countHouseholdRows(memberDb)).slice(0, 3)).toEqual([1, 1, 1]);
            })
        );
    });
});
