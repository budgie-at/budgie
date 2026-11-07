import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { householdStateAtom } from '@app/household/constant/household-state-atom.constant';
import { makeTestDbLayer, resetTestDb } from '@budgie-at/test-kit';
import {
    CloudSyncStatusEnum,
    CloudSyncService,
    HouseholdRoleEnum,
    buildHouseholdRemovalStatements,
    ICloudSyncScope
} from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, SyncDatabaseScopeEnum, SyncZoneRegistryRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import { HOUSEHOLD_CLOUD_ZONE, OWNER_RECORD_NAME, shareAcceptedEvent } from './household-harness';
import { makeSyncServiceContext, savedFrom, sentEvent } from './sync-service-harness';

describe('cloud-sync/household empty zone', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('owner and member', it => {
        it.effect('owner creates the household zone and syncs it empty without errors', () => {
            const owner = makeSyncServiceContext();

            return owner.run(
                Effect.gen(function* () {
                    const service = yield* CloudSyncService;
                    const registry = yield* SyncZoneRegistryRepository;

                    yield* service.prepareHouseholdOwnerZone();
                    yield* service.reconfigure;
                    yield* service.handleSentChanges(
                        sentEvent({ savedRecords: savedFrom(owner.transport.calls.savedBatches[0], 'system-meta') })
                    );
                    yield* service.drain;

                    const household = yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE);

                    expect(household).toMatchObject({
                        zoneName: HOUSEHOLD_CLOUD_ZONE,
                        databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                        role: SyncZoneRoleEnum.OWNER
                    });
                    expect(owner.transport.calls.ensuredZones).toContain(HOUSEHOLD_CLOUD_ZONE);
                    expect(owner.transport.calls.savedBatches.flat().filter(({ zoneName }) => zoneName === HOUSEHOLD_CLOUD_ZONE)).toEqual(
                        []
                    );
                    expect(owner.transport.calls.sharedStarted).toEqual([]);
                    expect(appAtomRegistry.get(cloudSyncStatusAtom).status).not.toBe(CloudSyncStatusEnum.ERROR);
                    expect(appAtomRegistry.get(householdStateAtom)).toEqual({ role: HouseholdRoleEnum.OWNER, isReady: true });
                })
            );
        });

        it.effect('member accepts the share, starts the shared engine and syncs an empty household without errors', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;

                yield* resetTestDb(memberDb);

                const member = makeSyncServiceContext(memberDb);

                yield* member.run(
                    Effect.gen(function* () {
                        const service = yield* CloudSyncService;
                        const registry = yield* SyncZoneRegistryRepository;

                        yield* service.reconfigure;
                        yield* service.handleShareAccepted(shareAcceptedEvent());
                        yield* service.handleFetchedChanges({
                            scope: ICloudSyncScope.SHARED,
                            batchId: 'shared-fetch',
                            records: [],
                            deletions: [],
                            changedShares: []
                        });
                        yield* service.handleDidFetch({ scope: ICloudSyncScope.SHARED });

                        const household = yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE);

                        expect(household).toMatchObject({
                            zoneName: HOUSEHOLD_CLOUD_ZONE,
                            ownerName: OWNER_RECORD_NAME,
                            databaseScope: SyncDatabaseScopeEnum.SHARED,
                            role: SyncZoneRoleEnum.PARTICIPANT
                        });
                        expect(member.transport.calls.sharedStarted).toEqual([null]);
                        expect(member.transport.calls.confirmed).toContain('shared-fetch');
                        expect(appAtomRegistry.get(cloudSyncStatusAtom).status).not.toBe(CloudSyncStatusEnum.ERROR);
                        expect(appAtomRegistry.get(householdStateAtom)).toEqual({ role: HouseholdRoleEnum.MEMBER, isReady: true });
                    })
                );
            })
        );
    });

    it('scopes every removal statement to the attached backup copy', () => {
        expect(buildHouseholdRemovalStatements('migrated.').map(statement => statement.replaceAll('migrated.', ''))).toEqual(
            buildHouseholdRemovalStatements('')
        );
        expect(testDb).toBeDefined();
    });
});
