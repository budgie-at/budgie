import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum, HouseholdShareService, ICloudErrorCode, ICloudSyncScope } from '@budgie/cloud-sync';
import {
    HOUSEHOLD_SYNC_ZONE,
    SyncDatabaseScopeEnum,
    SyncIdentityRepository,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as TestClock from 'effect/testing/TestClock';

import { seed, testDb } from '../../harness';

import {
    failedSaveOf,
    flattenBatches,
    readOutboxCount,
    reconfigureAndAcknowledgeMeta,
    runSyncService,
    savedFrom,
    sentEvent
} from './sync-service-harness';

const readSystemFields = (recordName: string) =>
    testDb.$client
        .unsafe<{ readonly systemFields: string | null }>('SELECT system_fields AS systemFields FROM sync_record WHERE sync_id = ?', [
            recordName
        ])
        .pipe(Effect.map(rows => rows.at(0)?.systemFields ?? null));

describe('cloud-sync/sync-service drain', () => {
    it.effect('holds data uploads until the zone meta record is saved, then drains and acknowledges the outbox', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const account = yield* seed.account({ title: 'Cash' });

                yield* seed.manualExpense({
                    accountId: account.id,
                    amount: 5_000_000,
                    operatedAt: new Date('2026-10-02T10:00:00Z'),
                    title: 'Cafe'
                });
                yield* service.reconfigure;

                expect(context.transport.calls.ensuredZones).toEqual(['Personal']);
                expect(context.transport.calls.started).toEqual([null]);
                expect(flattenBatches(context.transport.calls.savedBatches).map(({ recordType }) => recordType)).toEqual(['SyncMeta']);

                const [meta] = context.transport.calls.savedBatches;

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(meta, 'system-meta') }));

                const uploaded = flattenBatches(context.transport.calls.savedBatches.slice(1));
                const recordTypes = new Set(uploaded.map(({ recordType }) => recordType));

                expect(recordTypes.has('Account')).toBe(true);
                expect(recordTypes.has('Transaction')).toBe(true);
                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).toBe(CloudSyncStatusEnum.SYNCING);

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(uploaded, 'system-data') }));

                expect(yield* readOutboxCount).toBe(0);
                expect(yield* readSystemFields(account.syncId ?? '')).toBe('system-data');
                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).toBe(CloudSyncStatusEnum.IDLE);
                expect(context.store.holder.state.resolvedLineageId).toBe(yield* (yield* SyncIdentityRepository).ensureLineageId());
            })
        )
    );

    it.live('moves new data on shared accounts to the household zone before every drain', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const registry = yield* SyncZoneRegistryRepository;
                const householdShareService = yield* HouseholdShareService;

                yield* registry.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: 'Household',
                    ownerName: '__defaultOwner__',
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });
                yield* householdShareService.setShareEverything(true);

                const account = yield* seed.account({ title: 'Joint' });

                yield* seed.manualExpense({
                    accountId: account.id,
                    amount: 5_000_000,
                    operatedAt: new Date('2026-10-02T10:00:00Z'),
                    title: 'Cafe'
                });
                yield* reconfigureAndAcknowledgeMeta(context, service);

                const uploaded = flattenBatches(context.transport.calls.savedBatches.slice(1));
                const [zoneRow] = yield* testDb.$client.unsafe<{ readonly syncZone: string }>(
                    'SELECT sync_zone AS syncZone FROM accounts WHERE id = ?',
                    [account.id]
                );

                expect(zoneRow.syncZone).toBe(HOUSEHOLD_SYNC_ZONE);
                expect(uploaded.some(({ recordName, zoneName }) => recordName === account.syncId && zoneName === 'Household')).toBe(true);
                const [transactionRow] = yield* testDb.$client.unsafe<{ readonly syncId: string }>(
                    'SELECT sync_id AS syncId FROM transactions WHERE sync_zone = ?',
                    [HOUSEHOLD_SYNC_ZONE]
                );

                expect(uploaded.some(({ recordName, zoneName }) => recordName === transactionRow.syncId && zoneName === 'Household')).toBe(
                    true
                );
            })
        )
    );

    it.effect('re-pushes a record with the server system fields after resolving a server record conflict', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const account = yield* seed.account({ title: 'Cash' });

                yield* testDb.$client.unsafe('UPDATE accounts SET title = ? WHERE id = ?', ['Mine', account.id]);
                yield* reconfigureAndAcknowledgeMeta(context, service);

                const firstPush = flattenBatches(context.transport.calls.savedBatches.slice(1)).find(
                    ({ recordType }) => recordType === 'Account'
                );

                if (firstPush === undefined) {
                    return yield* Effect.die('account was not pushed');
                }

                const batchesBeforeConflict = context.transport.calls.savedBatches.length;
                const serverFields = Object.fromEntries(
                    Object.entries(firstPush.encryptedFields).flatMap(([field, value]) => (value === null ? [] : [[field, value] as const]))
                );

                yield* service.handleSentChanges(
                    sentEvent({
                        failedSaves: [
                            {
                                ...failedSaveOf(firstPush, ICloudErrorCode.SERVER_RECORD_CHANGED, 'changed', null),
                                serverRecord: {
                                    zoneName: firstPush.zoneName,
                                    ownerName: firstPush.ownerName,
                                    recordName: firstPush.recordName,
                                    recordType: firstPush.recordType,
                                    systemFields: 'system-server',
                                    schemaVersion: firstPush.schemaVersion,
                                    encryptedFields: { ...serverFields, title: 'Theirs', order: 7 }
                                }
                            }
                        ]
                    })
                );

                const rePush = flattenBatches(context.transport.calls.savedBatches.slice(batchesBeforeConflict)).find(
                    ({ recordType }) => recordType === 'Account'
                );

                expect(rePush?.systemFields).toBe('system-server');
                expect(rePush?.recordName).toBe(firstPush.recordName);
            })
        )
    );

    it.effect('sends an explicit null for a cleared field once the record has system fields', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const account = yield* seed.account({ title: 'Cash' });

                yield* testDb.$client.unsafe('UPDATE accounts SET iban = ? WHERE id = ?', ['DE00', account.id]);
                yield* reconfigureAndAcknowledgeMeta(context, service);

                const firstPush = flattenBatches(context.transport.calls.savedBatches.slice(1)).filter(
                    ({ recordType }) => recordType === 'Account'
                );

                expect(firstPush[0].encryptedFields['iban']).toBe('DE00');
                expect('iban' in firstPush[0].encryptedFields && firstPush[0].encryptedFields['iban'] === null).toBe(false);

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(firstPush, 'system-1') }));
                yield* testDb.$client.unsafe('UPDATE accounts SET iban = NULL WHERE id = ?', [account.id]);
                yield* service.drain;

                const secondPush = flattenBatches(context.transport.calls.savedBatches).filter(
                    ({ recordType, systemFields }) => recordType === 'Account' && systemFields === 'system-1'
                );

                expect(secondPush).toHaveLength(1);
                expect(secondPush[0].encryptedFields['iban']).toBeNull();
            })
        )
    );

    it.effect('persists engine state after a fetched batch', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* seed.account({ title: 'Cash' });
                yield* service.reconfigure;

                const pushed = flattenBatches(context.transport.calls.savedBatches).find(({ recordType }) => recordType === 'SyncMeta');

                expect(pushed).toBeDefined();

                yield* service.handleFetchedChanges({
                    scope: ICloudSyncScope.PRIVATE,
                    records: [
                        {
                            zoneName: 'Personal',
                            ownerName: '__defaultOwner__',
                            recordName: '0194a000-0000-7000-8000-000000000001',
                            recordType: 'Account',
                            systemFields: 'system-cloud',
                            schemaVersion: 1,
                            encryptedFields: {
                                title: 'From cloud',
                                type: 'CASH',
                                nature: 'ASSET',
                                instrumentCode: 'USD',
                                createdAt: 1_760_000_000_000,
                                updatedAt: 1_760_000_000_000,
                                order: 1
                            }
                        }
                    ],
                    deletions: [],
                    changedShares: []
                });

                yield* service.handleStateSerialization({ scope: ICloudSyncScope.PRIVATE, stateSerialization: 'state-1' });

                expect(context.store.holder.state.stateSerialization).toBe('state-1');
            })
        )
    );

    it.effect('does not persist engine state after a batch handler failed', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* reconfigureAndAcknowledgeMeta(context, service);
                yield* seed.account({ title: 'Cash' });
                context.transport.behavior.isSaveFailing = true;

                const exit = yield* Effect.exit(service.handleSentChanges(sentEvent()));

                expect(Exit.isFailure(exit)).toBe(true);

                yield* service.handleStateSerialization({ scope: ICloudSyncScope.PRIVATE, stateSerialization: 'state-after-failure' });

                expect(context.store.holder.state.stateSerialization).toBeNull();
            })
        )
    );

    it.effect('publishes a device heartbeat record for bank ownership once the zone is claimed', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* TestClock.setTime(Date.now());
                yield* reconfigureAndAcknowledgeMeta(context, service);

                const heartbeat = flattenBatches(context.transport.calls.savedBatches).find(
                    ({ recordType }) => recordType === 'SyncDevice'
                );

                expect(heartbeat?.recordName).toBe('install-a');
                expect(heartbeat?.encryptedFields['installId']).toBe('install-a');

                yield* service.handleSentChanges(
                    sentEvent({ savedRecords: savedFrom(heartbeat === undefined ? [] : [heartbeat], 'system-device') })
                );
                yield* service.drain;

                expect(
                    flattenBatches(context.transport.calls.savedBatches).filter(({ recordType }) => recordType === 'SyncDevice')
                ).toHaveLength(1);
            })
        )
    );
});
