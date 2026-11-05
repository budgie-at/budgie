import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { CloudSyncRestorePhaseEnum } from '@app/cloud-sync/enum/cloud-sync-restore-phase.enum';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { SyncIdentityRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { ICloudErrorCode, ICloudSyncScope } from '../../../../../packages/app/modules/icloud';
import { seed, testDb } from '../../harness';

import { makeSyncServiceContext, savedFrom, sentEvent } from './sync-service-harness';

import type { ICloudFetchedChangesEvent, ICloudFetchedRecord, ICloudRecordPayload } from '../../../../../packages/app/modules/icloud';

const metaWith = (lineageId: string): ICloudFetchedRecord => ({
    zoneName: 'Personal',
    ownerName: '__defaultOwner__',
    recordName: 'sync-meta',
    recordType: 'SyncMeta',
    systemFields: 'system-meta',
    schemaVersion: 1,
    encryptedFields: { lineageId }
});

const fetchedEvent = (records: readonly ICloudFetchedRecord[] = []): ICloudFetchedChangesEvent => ({
    scope: ICloudSyncScope.PRIVATE,
    batchId: `fetched-${Math.random()}`,
    records,
    deletions: [],
    changedShares: []
});

const readOutboxCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM sync_outbox')
    .pipe(Effect.map(([row]) => row.total));

const readAccountCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM accounts')
    .pipe(Effect.map(([row]) => row.total));

const startRestoreWithBaselineAccount = (context: ReturnType<typeof makeSyncServiceContext>) =>
    Effect.gen(function* () {
        const service = yield* CloudSyncService;
        const identity = yield* SyncIdentityRepository;
        const account = yield* seed.account({ title: 'Cash' });

        yield* testDb.$client.unsafe(
            `INSERT INTO sync_record (sync_zone, sync_id, record_type, system_fields, updated_at) SELECT sync_zone, sync_id, 'Account', 'old-system-fields', 1 FROM accounts WHERE id = ?`,
            [account.id]
        );
        context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
        context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
        yield* service.reconfigure();
        yield* service.handleFetchedChanges(fetchedEvent([metaWith(yield* identity.ensureLineageId())]));

        return { service, accountSyncId: account.syncId };
    });

const flatten = (batches: readonly (readonly ICloudRecordPayload[])[]) => batches.flat();

describe('cloud-sync/restore-reset service', () => {
    it.effect('runs the automatic writers once per applied fetched batch after confirming it', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;

                yield* service.handleFetchedChanges(fetchedEvent());
                yield* service.handleFetchedChanges(fetchedEvent());

                expect(context.transport.calls.confirmed).toHaveLength(2);
                expect(context.automation.holder.results).toHaveLength(2);
            })
        );
    });

    it.effect('reconciles a restored database against the zone, then uploads only rows the zone never held', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                context.store.holder.state = {
                    ...context.store.holder.state,
                    stateSerialization: 'stale-engine-state',
                    restorePhase: CloudSyncRestorePhaseEnum.PENDING
                };
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* service.reconfigure();

                expect(context.transport.calls.started).toEqual([null]);
                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                expect(yield* readOutboxCount).toBe(0);
                expect(context.transport.calls.savedBatches).toHaveLength(0);

                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                expect(context.transport.calls.savedBatches).toHaveLength(0);

                yield* service.handleFetchedChanges(fetchedEvent([metaWith(yield* identity.ensureLineageId())]));
                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(flatten(context.transport.calls.savedBatches).some(({ recordType }) => recordType === 'Account')).toBe(true);
            })
        );
    });

    it.live('deletes nothing while the zone inventory fails and reconciles at the next fetch cycle end', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const { service } = yield* startRestoreWithBaselineAccount(context);

                context.transport.behavior.isInventoryFailing = true;
                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.transport.calls.inventoryRequests).toBe(1);
                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.FETCHING);
                expect(yield* readAccountCount).toBe(1);

                context.transport.behavior.isInventoryFailing = false;
                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.transport.calls.inventoryRequests).toBe(2);
                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(yield* readAccountCount).toBe(0);
            })
        );
    });

    it.effect('keeps a restored row the zone inventory lists and finishes reconciliation', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const { service, accountSyncId } = yield* startRestoreWithBaselineAccount(context);

                context.transport.behavior.zoneInventory = [{ recordName: accountSyncId ?? '', recordType: 'Account' }];
                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(yield* readAccountCount).toBe(1);
            })
        );
    });

    it.effect('forces a stale engine state to a full fetch when the previous reconciliation was interrupted', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
                context.store.holder.state = {
                    ...context.store.holder.state,
                    stateSerialization: 'partial-engine-state',
                    restorePhase: CloudSyncRestorePhaseEnum.FETCHING
                };
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* testDb.$client.unsafe('INSERT INTO sync_outbox (record_type, sync_zone, sync_id) SELECT ?, sync_zone, sync_id FROM accounts LIMIT 1', ['Account']);
                yield* service.reconfigure();

                expect(context.transport.calls.started).toEqual([null]);
                expect(yield* readOutboxCount).toBe(1);
            })
        );
    });

    it.effect('treats an empty zone as nothing to reconcile and uploads everything', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;

                yield* seed.account({ title: 'Cash' });
                context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
                yield* service.reconfigure();

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(yield* readOutboxCount).toBeGreaterThan(0);
            })
        );
    });

    it.effect('keeps a quota-failed record in the outbox, flags the status and re-pushes it once the quota clears', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const service = yield* CloudSyncService;
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* service.reconfigure();

                const firstPush = flatten(context.transport.calls.savedBatches).find(({ recordType }) => recordType === 'Account');

                if (firstPush === undefined) {
                    return yield* Effect.die('account was not pushed');
                }

                const batchesBeforeFailure = context.transport.calls.savedBatches.length;

                yield* service.handleSentChanges(
                    sentEvent({
                        failedSaves: [
                            {
                                zoneName: firstPush.zoneName,
                                ownerName: firstPush.ownerName,
                                recordName: firstPush.recordName,
                                recordType: firstPush.recordType,
                                code: ICloudErrorCode.QUOTA_EXCEEDED,
                                message: 'quota',
                                serverRecord: null
                            }
                        ]
                    })
                );

                expect(yield* readOutboxCount).toBeGreaterThan(0);
                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(true);
                expect(context.transport.calls.savedBatches).toHaveLength(batchesBeforeFailure);

                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                const rePush = flatten(context.transport.calls.savedBatches.slice(batchesBeforeFailure)).find(
                    ({ recordName }) => recordName === firstPush.recordName
                );

                expect(rePush).toBeDefined();
                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(true);

                yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(rePush === undefined ? [] : [rePush], 'system-data') }));

                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(false);
                expect(yield* readOutboxCount).toBe(0);
            })
        );
    });
});
