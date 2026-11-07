import { DatabaseChangeService } from '@app/@generic/drizzle/service/database-change.service';
import { InstallIdService } from '@app/cloud-backup/service/install-id.service';
import { SyncAutomationService } from '@app/cloud-sync-automation/service/sync-automation.service';
import { CloudSyncRestorePhaseEnum } from '@app/cloud-sync/enum/cloud-sync-restore-phase.enum';
import { CloudSyncTransportError } from '@app/cloud-sync/error/cloud-sync-transport.error';
import { syncAccountBalanceRefresherLayer } from '@app/cloud-sync/layer/sync-account-balance-refresher.layer';
import { BankOwnershipService } from '@app/cloud-sync/service/bank-ownership.service';
import { CloudSyncSafetyCopyService } from '@app/cloud-sync/service/cloud-sync-safety-copy.service';
import { CloudSyncStateStore } from '@app/cloud-sync/service/cloud-sync-state-store.service';
import { CloudSyncTransport } from '@app/cloud-sync/service/cloud-sync-transport.service';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import {
    HouseholdMembershipService,
    HouseholdShareService,
    SyncApplyService,
    SyncOutboxRepository,
    SyncRestoreReconciliationService,
    SyncUploadService
} from '@budgie/cloud-sync';
import {
    BankIntegrationRepository,
    Db,
    SettingsRepository,
    SyncIdentityRepository,
    SyncRecordRepository,
    SyncRepository,
    SyncResetRepository,
    SyncZoneRegistryRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Stream from 'effect/Stream';

import { ICloudErrorCode, ICloudSyncScope } from '../../../../../packages/app/modules/icloud';
import { testDb } from '../../harness';

import type {
    ICloudAccountStatusResult,
    ICloudFetchedChangesEvent,
    ICloudFetchedRecord,
    ICloudJoinedHousehold,
    ICloudOwnedHousehold,
    ICloudRecordId,
    ICloudRecordPayload,
    ICloudSentChangesEvent,
    ICloudShareParticipant,
    ICloudZoneInventoryRecord
} from '../../../../../packages/app/modules/icloud';
import type { CloudSyncStateInterface } from '@app/cloud-sync/interface/cloud-sync-state.interface';
import type { SyncApplyResultInterface } from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

export const INSTALL_ID = 'install-a';

interface FakeTransportCallsInterface {
    readonly started: (string | null)[];
    stopped: number;
    readonly savedBatches: ICloudRecordPayload[][];
    readonly deletedBatches: ICloudRecordId[][];
    readonly confirmed: string[];
    readonly deletedZones: string[];
    readonly ensuredZones: string[];
    readonly confirmProbe: number[];
    inventoryRequests: number;
    readonly sharedStarted: (string | null)[];
    sharedStopped: number;
    readonly sharedSavedBatches: ICloudRecordPayload[][];
    readonly sharedDeletedBatches: ICloudRecordId[][];
    readonly createdShares: string[];
    readonly stoppedShares: string[];
    readonly leftShares: string[];
    readonly removedParticipants: string[];
}

interface FakeTransportBehaviorInterface {
    accountStatus: ICloudAccountStatusResult;
    zoneMeta: ICloudFetchedRecord | null;
    zoneInventory: readonly ICloudZoneInventoryRecord[];
    sharedZoneInventory: readonly ICloudZoneInventoryRecord[] | null;
    isInventoryFailing: boolean;
    confirmProbeSql: string;
    participants: readonly ICloudShareParticipant[];
    joinedHousehold: ICloudJoinedHousehold | null;
    ownedHousehold: ICloudOwnedHousehold | null;
}

const makeFakeTransport = (database: DB = testDb) => {
    const calls: FakeTransportCallsInterface = {
        started: [],
        stopped: 0,
        savedBatches: [],
        deletedBatches: [],
        confirmed: [],
        deletedZones: [],
        ensuredZones: [],
        confirmProbe: [],
        inventoryRequests: 0,
        sharedStarted: [],
        sharedStopped: 0,
        sharedSavedBatches: [],
        sharedDeletedBatches: [],
        createdShares: [],
        stoppedShares: [],
        leftShares: [],
        removedParticipants: []
    };
    const behavior: FakeTransportBehaviorInterface = {
        accountStatus: { status: 'available', userRecordName: 'user-a' },
        zoneMeta: null,
        zoneInventory: [],
        sharedZoneInventory: null,
        isInventoryFailing: false,
        confirmProbeSql: 'SELECT COUNT(*) AS total FROM accounts',
        participants: [],
        joinedHousehold: null,
        ownedHousehold: null
    };

    const layer = Layer.succeed(CloudSyncTransport, {
        events: Stream.empty,
        getAccountStatus: Effect.sync(() => behavior.accountStatus),
        startSync: (startScope: ICloudSyncScope, state: string | null) =>
            Effect.sync(() => {
                if (startScope === ICloudSyncScope.SHARED) {
                    calls.sharedStarted.push(state);
                } else {
                    calls.started.push(state);
                }
            }),
        stopSync: (stopScope: ICloudSyncScope) =>
            Effect.sync(() => {
                if (stopScope === ICloudSyncScope.SHARED) {
                    calls.sharedStopped += 1;
                } else {
                    calls.stopped += 1;
                }
            }),
        syncNow: () => Effect.void,
        ensureZone: (_scope: ICloudSyncScope, zoneName: string) =>
            Effect.sync(() => {
                calls.ensuredZones.push(zoneName);
            }),
        deleteZone: (_scope: ICloudSyncScope, zoneName: string) =>
            Effect.sync(() => {
                calls.deletedZones.push(zoneName);
                behavior.zoneMeta = null;
            }),
        fetchRecord: () => Effect.sync(() => behavior.zoneMeta),
        fetchZoneInventory: (inventoryScope: ICloudSyncScope) =>
            Effect.suspend(() => {
                calls.inventoryRequests += 1;

                return behavior.isInventoryFailing
                    ? Effect.fail(CloudSyncTransportError.make({ code: ICloudErrorCode.NETWORK_UNAVAILABLE, message: 'inventory failed' }))
                    : Effect.succeed(
                          inventoryScope === ICloudSyncScope.SHARED
                              ? (behavior.sharedZoneInventory ?? behavior.zoneInventory)
                              : behavior.zoneInventory
                      );
            }),
        addPendingSaves: (saveScope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) =>
            Effect.sync(() => {
                (saveScope === ICloudSyncScope.SHARED ? calls.sharedSavedBatches : calls.savedBatches).push([...records]);
            }),
        addPendingDeletes: (deleteScope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) =>
            Effect.sync(() => {
                (deleteScope === ICloudSyncScope.SHARED ? calls.sharedDeletedBatches : calls.deletedBatches).push([...recordIds]);
            }),
        confirmFetchedBatch: (_scope: ICloudSyncScope, batchId: string) =>
            database.$client.unsafe<{ readonly total: number }>(behavior.confirmProbeSql).pipe(
                Effect.orDie,
                Effect.tap(([row]) =>
                    Effect.sync(() => {
                        calls.confirmProbe.push(row.total);
                        calls.confirmed.push(batchId);
                    })
                ),
                Effect.asVoid
            ),
        createHouseholdShare: (zoneName: string) =>
            Effect.sync(() => {
                calls.createdShares.push(zoneName);
            }),
        getShareParticipants: () => Effect.sync(() => behavior.participants),
        findOwnedHousehold: () => Effect.sync(() => behavior.ownedHousehold),
        findJoinedHousehold: () => Effect.sync(() => behavior.joinedHousehold),
        stopSharing: (zoneName: string) =>
            Effect.sync(() => {
                calls.stoppedShares.push(zoneName);
            }),
        leaveShare: (zoneName: string) =>
            Effect.sync(() => {
                calls.leftShares.push(zoneName);
            }),
        removeParticipant: (_zoneName: string, participantId: string) =>
            Effect.sync(() => {
                calls.removedParticipants.push(participantId);
            })
    });

    return { calls, behavior, layer };
};

const EMPTY_STATE: CloudSyncStateInterface = {
    boundUserRecordName: null,
    stateSerialization: null,
    sharedStateSerialization: null,
    resolvedLineageId: null,
    restorePhase: CloudSyncRestorePhaseEnum.NONE,
    isHouseholdCleanupPending: false,
    householdOwnerDisplayName: null
};

const makeFakeAutomation = () => {
    const holder: { readonly results: SyncApplyResultInterface[] } = { results: [] };
    const layer = Layer.succeed(SyncAutomationService, {
        afterApply: (result: SyncApplyResultInterface) =>
            Effect.sync(() => {
                holder.results.push(result);

                return { consolidated: 0, ruleTransactionCount: 0, embeddingQueuedCount: 0, isRecurringDetected: false };
            })
    });

    return { holder, layer };
};

const makeFakeStateStore = () => {
    const holder: { state: CloudSyncStateInterface } = {
        state: { ...EMPTY_STATE }
    };
    const layer = Layer.succeed(CloudSyncStateStore, {
        read: Effect.sync(() => holder.state),
        update: (patch: Partial<CloudSyncStateInterface>) =>
            Effect.sync(() => {
                holder.state = { ...holder.state, ...patch };
            }),
        clear: Effect.sync(() => {
            holder.state = { ...EMPTY_STATE };
        })
    });

    return { holder, layer };
};

const makeFakeSafetyCopy = () => {
    const holder = { created: 0 };
    const layer = Layer.succeed(CloudSyncSafetyCopyService, {
        create: () =>
            Effect.sync(() => {
                holder.created += 1;
            })
    });

    return { holder, layer };
};

const installIdLayer = Layer.succeed(InstallIdService, { get: Effect.succeed(INSTALL_ID) });

export const makeSyncServiceContext = (database: DB = testDb) => {
    const transport = makeFakeTransport(database);
    const store = makeFakeStateStore();
    const safetyCopy = makeFakeSafetyCopy();
    const automation = makeFakeAutomation();
    const applyLayer = SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer));
    const dependencies = Layer.mergeAll(
        transport.layer,
        store.layer,
        safetyCopy.layer,
        automation.layer,
        installIdLayer,
        SettingsRepository.layer,
        SyncUploadService.layer,
        applyLayer,
        SyncRestoreReconciliationService.layer.pipe(Layer.provide(applyLayer)),
        HouseholdMembershipService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)),
        HouseholdShareService.layer,
        SyncOutboxRepository.layer,
        SyncRecordRepository.layer,
        SyncZoneRegistryRepository.layer,
        SyncRepository.layer,
        BankIntegrationRepository.layer,
        SyncIdentityRepository.layer,
        SyncResetRepository.layer,
        Layer.effect(BankOwnershipService, BankOwnershipService.make).pipe(
            Layer.provide([installIdLayer, BankIntegrationRepository.layer, SyncRecordRepository.layer])
        ),
        DatabaseChangeService.layer
    ).pipe(Layer.provide(Reactivity.layer));
    const layer = Layer.effect(CloudSyncService, CloudSyncService.make).pipe(Layer.provideMerge(dependencies));

    const run = <A, E>(effect: Effect.Effect<A, E, Layer.Success<typeof layer> | Db>) =>
        Effect.andThen(database.$client.unsafe('UPDATE settings SET lineage_id = NULL'), effect).pipe(
            Effect.provide(layer),
            Effect.provideService(Db, database)
        );

    return { transport, store, safetyCopy, automation, run };
};

export const sentEvent = (patch: Partial<ICloudSentChangesEvent> = {}): ICloudSentChangesEvent => ({
    scope: ICloudSyncScope.PRIVATE,
    batchId: `sent-${Math.random()}`,
    savedRecords: [],
    failedSaves: [],
    deletedRecords: [],
    failedDeletes: [],
    savedZones: [],
    failedZoneSaves: [],
    deletedZones: [],
    failedZoneDeletes: [],
    ...patch
});

export const savedFrom = (payloads: readonly ICloudRecordPayload[], systemFields: string): ICloudSentChangesEvent['savedRecords'] =>
    payloads.map(({ zoneName, ownerName, recordName, recordType }) => ({ zoneName, ownerName, recordName, recordType, systemFields }));

export const metaWith = (lineageId: string): ICloudFetchedRecord => ({
    zoneName: 'Personal',
    ownerName: '__defaultOwner__',
    recordName: 'sync-meta',
    recordType: 'SyncMeta',
    systemFields: 'system-meta',
    schemaVersion: 1,
    encryptedFields: { lineageId }
});

export const fetchedEvent = (records: readonly ICloudFetchedRecord[] = []): ICloudFetchedChangesEvent => ({
    scope: ICloudSyncScope.PRIVATE,
    batchId: `fetched-${Math.random()}`,
    records,
    deletions: [],
    changedShares: []
});
