import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum } from '@app/cloud-sync/enum/cloud-sync-status.enum';
import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import {
    HOUSEHOLD_SYNC_ZONE,
    HouseholdShareService,
    SyncDatabaseScopeEnum,
    SyncIdentityRepository,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';

import { ICloudErrorCode, ICloudSyncScope } from '../../../../../packages/app/modules/icloud';
import { seed, testDb } from '../../harness';

import { makeSyncServiceContext, savedFrom, sentEvent } from './sync-service-harness';

import type { ICloudRecordPayload } from '../../../../../packages/app/modules/icloud';

const readOutboxCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM sync_outbox')
    .pipe(Effect.map(([row]) => row.total));

const readSystemFields = (recordName: string) =>
    testDb.$client
        .unsafe<{ readonly systemFields: string | null }>('SELECT system_fields AS systemFields FROM sync_record WHERE sync_id = ?', [recordName])
        .pipe(Effect.map(([row]) => row?.systemFields ?? null));

const flatten = (batches: readonly (readonly ICloudRecordPayload[])[]) => batches.flat();

describe('cloud-sync/sync-service drain', () => {
    it.effect('holds data uploads until the zone meta record is saved, then drains and acknowledges the outbox', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const account = yield* seed.account({ title: 'Cash' });

                yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: new Date('2026-10-02T10:00:00Z'), title: 'Cafe' });
                yield* service.reconfigure();

                expect(context.transport.calls.ensuredZones).toEqual(['Personal']);
                expect(context.transport.calls.started).toEqual([null]);
                expect(flatten(context.transport.calls.savedBatches).map(({ recordType }) => recordType)).toEqual(['SyncMeta']);

                const meta = context.transport.calls.savedBatches[0];

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(meta, 'system-meta') }));

                const uploaded = flatten(context.transport.calls.savedBatches.slice(1));
                const recordTypes = new Set(uploaded.map(({ recordType }) => recordType));

                expect(recordTypes.has('Account')).toBe(true);
                expect(recordTypes.has('Transaction')).toBe(true);
                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).toBe(CloudSyncStatusEnum.SYNCING);

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(uploaded, 'system-data') }));

                expect(yield* readOutboxCount).toBe(0);
                expect(yield* readSystemFields(account.syncId ?? '')).toBe('system-data');
                expect(appAtomRegistry.get(cloudSyncStatusAtom).status).toBe(CloudSyncStatusEnum.IDLE);
                expect(context.store.holder.state.resolvedLineageId).toBe(yield* (yield* SyncIdentityRepository).ensureLineageId());
                expect(context.transport.calls.confirmed).toHaveLength(2);
            })
        );
    });

    it.live('moves new data on shared accounts to the household zone before every drain', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
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

                yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: new Date('2026-10-02T10:00:00Z'), title: 'Cafe' });
                yield* service.reconfigure();
                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') }));

                const uploaded = flatten(context.transport.calls.savedBatches.slice(1));
                const [zoneRow] = yield* testDb.$client.unsafe<{ readonly syncZone: string }>('SELECT sync_zone AS syncZone FROM accounts WHERE id = ?', [
                    account.id
                ]);

                expect(zoneRow.syncZone).toBe(HOUSEHOLD_SYNC_ZONE);
                expect(uploaded.some(({ recordName, zoneName }) => recordName === account.syncId && zoneName === 'Household')).toBe(true);
                const [transactionRow] = yield* testDb.$client.unsafe<{ readonly syncId: string }>(
                    'SELECT sync_id AS syncId FROM transactions WHERE sync_zone = ?',
                    [HOUSEHOLD_SYNC_ZONE]
                );

                expect(uploaded.some(({ recordName, zoneName }) => recordName === transactionRow.syncId && zoneName === 'Household')).toBe(true);
            })
        );
    });

    it.effect('re-pushes a record with the server system fields after resolving a server record conflict', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const account = yield* seed.account({ title: 'Cash' });

                yield* testDb.$client.unsafe('UPDATE accounts SET title = ? WHERE id = ?', ['Mine', account.id]);
                yield* service.reconfigure();
                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') }));

                const firstPush = flatten(context.transport.calls.savedBatches.slice(1)).find(({ recordType }) => recordType === 'Account');

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
                                zoneName: firstPush.zoneName,
                                ownerName: firstPush.ownerName,
                                recordName: firstPush.recordName,
                                recordType: firstPush.recordType,
                                code: ICloudErrorCode.SERVER_RECORD_CHANGED,
                                message: 'changed',
                                serverRecord: {
                                    zoneName: firstPush.zoneName,
                                    ownerName: firstPush.ownerName,
                                    recordName: firstPush.recordName,
                                    recordType: firstPush.recordType,
                                    systemFields: JSON.stringify({ modifiedAt: 50 }),
                                    schemaVersion: firstPush.schemaVersion,
                                    encryptedFields: { ...serverFields, title: 'Theirs', order: 7 }
                                }
                            }
                        ]
                    })
                );

                const rePush = flatten(context.transport.calls.savedBatches.slice(batchesBeforeConflict)).find(
                    ({ recordType }) => recordType === 'Account'
                );

                expect(rePush?.systemFields).toBe(JSON.stringify({ modifiedAt: 50 }));
                expect(rePush?.recordName).toBe(firstPush.recordName);
            })
        );
    });

    it.effect('sends an explicit null for a cleared field once the record has system fields', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const account = yield* seed.account({ title: 'Cash' });

                yield* testDb.$client.unsafe('UPDATE accounts SET iban = ? WHERE id = ?', ['DE00', account.id]);
                yield* service.reconfigure();
                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') }));

                const firstPush = flatten(context.transport.calls.savedBatches.slice(1)).filter(({ recordType }) => recordType === 'Account');

                expect(firstPush[0].encryptedFields['iban']).toBe('DE00');
                expect('iban' in firstPush[0].encryptedFields && firstPush[0].encryptedFields['iban'] === null).toBe(false);

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(firstPush, 'system-1') }));
                yield* testDb.$client.unsafe('UPDATE accounts SET iban = NULL WHERE id = ?', [account.id]);
                yield* service.drain();

                const secondPush = flatten(context.transport.calls.savedBatches).filter(
                    ({ recordType, systemFields }) => recordType === 'Account' && systemFields === 'system-1'
                );

                expect(secondPush).toHaveLength(1);
                expect(secondPush[0].encryptedFields['iban']).toBeNull();
            })
        );
    });

    it.effect('confirms a fetched batch only after it is committed and persists engine state', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                yield* seed.account({ title: 'Cash' });
                yield* service.reconfigure();
                context.transport.behavior.confirmProbeSql = "SELECT COUNT(*) AS total FROM accounts WHERE title = 'From cloud'";

                const pushed = flatten(context.transport.calls.savedBatches).find(({ recordType }) => recordType === 'SyncMeta');

                expect(pushed).toBeDefined();

                yield* service.handleFetchedChanges({
                    scope: ICloudSyncScope.PRIVATE,
                    batchId: 'fetched-1',
                    records: [
                        {
                            zoneName: 'Personal',
                            ownerName: '__defaultOwner__',
                            recordName: '0194a000-0000-7000-8000-000000000001',
                            recordType: 'Account',
                            systemFields: JSON.stringify({ modifiedAt: 10 }),
                            schemaVersion: 1,
                            encryptedFields: { title: 'From cloud', type: 'CASH', nature: 'ASSET', instrumentCode: 'USD', createdAt: 1_760_000_000_000, updatedAt: 1_760_000_000_000, order: 1 }
                        }
                    ],
                    deletions: [],
                    changedShares: []
                });

                expect(context.transport.calls.confirmed).toEqual(['fetched-1']);
                expect(context.transport.calls.confirmProbe).toEqual([1]);

                yield* service.handleStateSerialization({ scope: ICloudSyncScope.PRIVATE, stateSerialization: 'state-1' });

                expect(context.store.holder.state.stateSerialization).toBe('state-1');
            })
        );
    });

    it.effect('publishes a device heartbeat record for bank ownership once the zone is claimed', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;

                yield* TestClock.setTime(Date.now());
                yield* service.reconfigure();
                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') }));

                const heartbeat = flatten(context.transport.calls.savedBatches).find(({ recordType }) => recordType === 'SyncDevice');

                expect(heartbeat?.recordName).toBe('install-a');
                expect(heartbeat?.encryptedFields['installId']).toBe('install-a');

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(heartbeat === undefined ? [] : [heartbeat], 'system-device') }));
                yield* service.drain();

                expect(flatten(context.transport.calls.savedBatches).filter(({ recordType }) => recordType === 'SyncDevice')).toHaveLength(1);
            })
        );
    });
});
