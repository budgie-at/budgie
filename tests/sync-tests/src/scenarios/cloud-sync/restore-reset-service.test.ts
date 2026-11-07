import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { cloudSyncStatusAtom } from '@app/cloud-sync/constant/cloud-sync-status-atom.constant';
import { SyncOutboxRepository, CloudSyncRestorePhaseEnum, ICloudErrorCode, ICloudSyncScope } from '@budgie/cloud-sync';
import { SyncOutboxOperationEnum, SyncResetRepository, SyncRecordRepository, SyncIdentityRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    onDevice,
    seed,
    testDb,
    SyncServiceType,
    failedSaveOf,
    fetchedEvent,
    flattenBatches,
    matchZoneLineage,
    metaWith,
    readAccountCount,
    readOutboxCount,
    runSyncService,
    savedFrom,
    sentEvent
} from '../../harness';

const startRestoreWithBaselineAccount = (context: Parameters<Parameters<typeof runSyncService>[0]>[0], service: SyncServiceType) =>
    Effect.gen(function* () {
        const identity = yield* SyncIdentityRepository;
        const account = yield* seed.account({ title: 'Cash' });

        yield* testDb.$client.unsafe(
            `INSERT INTO sync_record (sync_zone, sync_id, record_type, system_fields, updated_at) SELECT sync_zone, sync_id, 'Account', 'old-system-fields', 1 FROM accounts WHERE id = ?`,
            [account.id]
        );
        context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
        yield* matchZoneLineage(context);
        yield* service.reconfigure;
        yield* service.handleFetchedChanges(fetchedEvent([metaWith(yield* identity.ensureLineageId())]));

        return account.syncId;
    });

describe('cloud-sync/restore-reset service', () => {
    it.effect('runs the automatic writers once per applied fetched batch', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* service.handleFetchedChanges(fetchedEvent());
                yield* service.handleFetchedChanges(fetchedEvent());

                expect(context.automation.holder.results).toHaveLength(2);
            })
        )
    );

    it.effect('reconciles a restored database against the zone, then uploads only rows the zone never held', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                context.store.holder.state = {
                    ...context.store.holder.state,
                    stateSerialization: 'stale-engine-state',
                    restorePhase: CloudSyncRestorePhaseEnum.PENDING
                };
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* service.reconfigure;

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
                expect(flattenBatches(context.transport.calls.savedBatches).some(({ recordType }) => recordType === 'Account')).toBe(true);
            })
        )
    );

    it.live('deletes nothing while the zone inventory fails and reconciles at the next fetch cycle end', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* startRestoreWithBaselineAccount(context, service);

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
        )
    );

    it.effect('keeps a restored row the zone inventory lists and finishes reconciliation', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const accountSyncId = yield* startRestoreWithBaselineAccount(context, service);

                context.transport.behavior.zoneInventory = [{ recordName: accountSyncId ?? '', recordType: 'Account' }];
                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(yield* readAccountCount).toBe(1);
            })
        )
    );

    it.effect('forces a stale engine state to a full fetch when the previous reconciliation was interrupted', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                const identity = yield* SyncIdentityRepository;

                yield* seed.account({ title: 'Cash' });
                yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
                context.store.holder.state = {
                    ...context.store.holder.state,
                    stateSerialization: 'partial-engine-state',
                    restorePhase: CloudSyncRestorePhaseEnum.FETCHING
                };
                context.transport.behavior.zoneMeta = metaWith(yield* identity.ensureLineageId());
                yield* testDb.$client.unsafe(
                    'INSERT INTO sync_outbox (record_type, sync_zone, sync_id) SELECT ?, sync_zone, sync_id FROM accounts LIMIT 1',
                    ['Account']
                );
                yield* service.reconfigure;

                expect(context.transport.calls.started).toEqual([null]);
                expect(yield* readOutboxCount).toBe(1);
            })
        )
    );

    it.effect('treats an empty zone as nothing to reconcile and uploads everything', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* seed.account({ title: 'Cash' });
                context.store.holder.state = { ...context.store.holder.state, restorePhase: CloudSyncRestorePhaseEnum.PENDING };
                yield* service.reconfigure;

                expect(context.store.holder.state.restorePhase).toBe(CloudSyncRestorePhaseEnum.NONE);
                expect(yield* readOutboxCount).toBeGreaterThan(0);
            })
        )
    );

    it.effect('keeps a quota-failed record in the outbox, flags the status and re-pushes it once the quota clears', () =>
        runSyncService((context, service) =>
            Effect.gen(function* () {
                yield* seed.account({ title: 'Cash' });
                yield* matchZoneLineage(context);
                yield* service.reconfigure;

                const firstPush = flattenBatches(context.transport.calls.savedBatches).find(({ recordType }) => recordType === 'Account');

                if (firstPush === undefined) {
                    return yield* Effect.die('account was not pushed');
                }

                const batchesBeforeFailure = context.transport.calls.savedBatches.length;

                yield* service.handleSentChanges(
                    sentEvent({
                        failedSaves: [failedSaveOf(firstPush, ICloudErrorCode.QUOTA_EXCEEDED, 'quota', null)]
                    })
                );

                expect(yield* readOutboxCount).toBeGreaterThan(0);
                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(true);
                expect(context.transport.calls.savedBatches).toHaveLength(batchesBeforeFailure);

                yield* service.handleDidFetch({ scope: ICloudSyncScope.PRIVATE });

                const rePush = flattenBatches(context.transport.calls.savedBatches.slice(batchesBeforeFailure)).find(
                    ({ recordName }) => recordName === firstPush.recordName
                );

                expect(rePush).toBeDefined();
                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(true);

                yield* service.handleSentChanges(
                    sentEvent({ savedRecords: savedFrom(rePush === undefined ? [] : [rePush], 'system-data') })
                );

                expect(appAtomRegistry.get(cloudSyncStatusAtom).isQuotaExceeded).toBe(false);
                expect(yield* readOutboxCount).toBe(0);
            })
        )
    );
    it.effect('keeps account ownership tombstones when resetting sync state', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                const records = yield* SyncRecordRepository;
                yield* records.upsert({
                    syncZone: 'personal',
                    syncId: 'own-shared-account',
                    recordType: 'Account',
                    payload: '{"encryptedFields":{"movedTo":"household"}}',
                    systemFields: 'stale-tag'
                });
                yield* (yield* SyncOutboxRepository).enqueue({
                    recordType: 'Account',
                    syncZone: 'personal',
                    syncId: 'pending-move',
                    operation: SyncOutboxOperationEnum.DELETE,
                    changedColumns: '["@movedTo:household"]'
                });
                yield* (yield* SyncResetRepository).clearSyncState();
                expect(yield* testDb.$client.unsafe("SELECT changed_columns FROM sync_outbox WHERE sync_id = 'pending-move'")).toEqual([
                    { changed_columns: '["@movedTo:household"]' }
                ]);
                yield* (yield* SyncOutboxRepository).enqueueAll('personal');
                expect((yield* records.find('personal', 'own-shared-account'))?.systemFields).toBeNull();
                expect(
                    yield* testDb.$client.unsafe("SELECT operation, changed_columns FROM sync_outbox WHERE sync_id = 'own-shared-account'")
                ).toEqual([{ operation: 'DELETE', changed_columns: '["@movedTo:household"]' }]);
            }).pipe(Effect.provide(SyncResetRepository.layer))
        )
    );

    it.effect('keeps seed categories, translations and MCC links when adopting cloud data', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                const before = yield* testDb.$client.unsafe(
                    'SELECT m.id, m.default_category_id, c.sync_id FROM mcc_categories m INNER JOIN categories c ON c.id = m.default_category_id WHERE c.is_default = 1 ORDER BY m.id'
                );
                const translations = yield* testDb.$client.unsafe(
                    'SELECT category_id, language, title FROM default_category_translations ORDER BY category_id, language'
                );
                expect(before.length).toBeGreaterThan(0);
                expect(translations.length).toBeGreaterThan(0);
                yield* (yield* SyncResetRepository).clearSyncedData();
                expect(
                    yield* testDb.$client.unsafe(
                        'SELECT m.id, m.default_category_id, c.sync_id FROM mcc_categories m INNER JOIN categories c ON c.id = m.default_category_id WHERE c.is_default = 1 ORDER BY m.id'
                    )
                ).toEqual(before);
                expect(
                    yield* testDb.$client.unsafe(
                        'SELECT category_id, language, title FROM default_category_translations ORDER BY category_id, language'
                    )
                ).toEqual(translations);
            }).pipe(Effect.provide(SyncResetRepository.layer))
        )
    );
});
