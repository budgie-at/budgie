import { cloudSyncDatabaseChangesLayer } from '@app/cloud-sync/layer/cloud-sync-database-changes.layer';
import { cloudSyncHostLayer } from '@app/cloud-sync/layer/cloud-sync-host.layer';
import {
    ICloudAccountStatusEnum,
    cloudSyncDomainLayer,
    CloudSyncInstallId,
    SyncAutomationService,
    CloudSyncRestorePhaseEnum,
    CloudSyncTransportError,
    BankOwnershipService,
    CloudSyncSafetyCopy,
    CloudSyncStateStore,
    CloudSyncTransport,
    CloudSyncService,
    CloudSyncEngineService,
    CloudSyncFetchService,
    CloudSyncHouseholdService,
    CloudSyncSentService,
    ICloudErrorCode,
    ICloudSyncScope
} from '@budgie/cloud-sync';
import { BankIntegrationRepository, Db, SyncIdentityRepository, SyncRepository, SyncResetRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Stream from 'effect/Stream';

import { testDb } from '../scenario/test-db';

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
    ICloudZoneInventoryRecord,
    SyncApplyResultInterface,
    CloudSyncStateInterface
} from '@budgie/cloud-sync';
import type { DB } from '@budgie/contracts';

export const INSTALL_ID = 'install-a';

interface FakeTransportCallsInterface {
    readonly started: (string | null)[];
    stopped: number;
    readonly savedBatches: ICloudRecordPayload[][];
    readonly deletedBatches: ICloudRecordId[][];
    readonly deletedZones: string[];
    readonly ensuredZones: string[];
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
    failingInventoryZone: string | null;
    isSaveFailing: boolean;
    participants: readonly ICloudShareParticipant[];
    joinedHousehold: ICloudJoinedHousehold | null;
    ownedHousehold: ICloudOwnedHousehold | null;
}

const makeFakeTransport = () => {
    const calls: FakeTransportCallsInterface = {
        started: [],
        stopped: 0,
        savedBatches: [],
        deletedBatches: [],
        deletedZones: [],
        ensuredZones: [],
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
        accountStatus: { status: ICloudAccountStatusEnum.AVAILABLE, userRecordName: 'user-a' },
        zoneMeta: null,
        zoneInventory: [],
        sharedZoneInventory: null,
        isInventoryFailing: false,
        failingInventoryZone: null,
        isSaveFailing: false,
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
        fetchZoneInventory: (inventoryScope: ICloudSyncScope, zoneName: string) =>
            Effect.suspend(() => {
                calls.inventoryRequests += 1;

                return behavior.isInventoryFailing || behavior.failingInventoryZone === zoneName
                    ? Effect.fail(CloudSyncTransportError.make({ code: ICloudErrorCode.NETWORK_UNAVAILABLE, message: 'inventory failed' }))
                    : Effect.succeed(
                          inventoryScope === ICloudSyncScope.SHARED
                              ? (behavior.sharedZoneInventory ?? behavior.zoneInventory)
                              : behavior.zoneInventory
                      );
            }),
        addPendingSaves: (saveScope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) =>
            behavior.isSaveFailing
                ? Effect.fail(CloudSyncTransportError.make({ code: ICloudErrorCode.NETWORK_UNAVAILABLE, message: 'save failed' }))
                : Effect.sync(() => {
                      (saveScope === ICloudSyncScope.SHARED ? calls.sharedSavedBatches : calls.savedBatches).push([...records]);
                  }),
        addPendingDeletes: (deleteScope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) =>
            Effect.sync(() => {
                (deleteScope === ICloudSyncScope.SHARED ? calls.sharedDeletedBatches : calls.deletedBatches).push([...recordIds]);
            }),
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
    const layer = Layer.succeed(CloudSyncSafetyCopy, {
        create: Effect.sync(() => {
            holder.created += 1;
        })
    });

    return { holder, layer };
};

const installIdLayer = Layer.succeed(CloudSyncInstallId, Effect.succeed(INSTALL_ID));

export const makeSyncServiceContext = (database: DB = testDb) => {
    const transport = makeFakeTransport();
    const store = makeFakeStateStore();
    const safetyCopy = makeFakeSafetyCopy();
    const automation = makeFakeAutomation();
    const dependencies = Layer.mergeAll(
        transport.layer,
        store.layer,
        safetyCopy.layer,
        automation.layer,
        cloudSyncDomainLayer.pipe(Layer.provide([cloudSyncHostLayer, store.layer])),
        SyncRepository.layer,
        BankIntegrationRepository.layer,
        SyncIdentityRepository.layer,
        SyncResetRepository.layer,
        BankOwnershipService.layer.pipe(Layer.provide(installIdLayer)),
        cloudSyncHostLayer,
        cloudSyncDatabaseChangesLayer
    ).pipe(Layer.provide(Reactivity.layer), Layer.provideMerge(installIdLayer));
    const layer = Layer.mergeAll(
        CloudSyncService.layer,
        CloudSyncEngineService.layer,
        CloudSyncFetchService.layer,
        CloudSyncHouseholdService.layer,
        CloudSyncSentService.layer
    ).pipe(Layer.provideMerge(dependencies));

    const run = <A, E>(effect: Effect.Effect<A, E, Layer.Success<typeof layer> | Db>) =>
        Effect.andThen(database.$client.unsafe('UPDATE settings SET lineage_id = NULL'), effect).pipe(
            Effect.provide(layer),
            Effect.provideService(Db, database)
        );

    return { transport, store, safetyCopy, automation, run };
};

export const sentEvent = (patch: Partial<ICloudSentChangesEvent> = {}): ICloudSentChangesEvent => ({
    scope: ICloudSyncScope.PRIVATE,
    savedRecords: [],
    failedSaves: [],
    deletedRecords: [],
    failedDeletes: [],
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
    records,
    deletions: [],
    changedShares: []
});

type SyncServiceContext = ReturnType<typeof makeSyncServiceContext>;

export const syncService = Effect.gen(function* () {
    const service = yield* CloudSyncService;
    const fetchService = yield* CloudSyncFetchService;
    const sentService = yield* CloudSyncSentService;
    const engineService = yield* CloudSyncEngineService;
    const householdService = yield* CloudSyncHouseholdService;

    return {
        ...service,
        handleFetchedChanges: fetchService.handleFetchedChanges,
        handleStateSerialization: fetchService.handleStateSerialization,
        handleDidFetch: fetchService.handleDidFetch,
        handleSentChanges: sentService.handleSentChanges,
        handleZoneChange: engineService.handleZoneChange,
        handleShareAccepted: householdService.handleShareAccepted,
        prepareHouseholdOwnerZone: householdService.prepareHouseholdOwnerZone
    };
});

export type SyncServiceType = Effect.Success<typeof syncService>;

export const runSyncService = <A, E>(
    body: (
        context: SyncServiceContext,
        service: SyncServiceType
    ) => Effect.Effect<A, E, Effect.Services<Parameters<SyncServiceContext['run']>[0]>>
) => {
    const context = makeSyncServiceContext();

    return context.run(
        Effect.gen(function* () {
            const service = yield* syncService;

            return yield* body(context, service);
        })
    );
};

export const readOutboxCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM sync_outbox')
    .pipe(Effect.map(([row]) => row.total));

export const readAccountCount = testDb.$client
    .unsafe<{ readonly total: number }>('SELECT COUNT(*) AS total FROM accounts')
    .pipe(Effect.map(([row]) => row.total));

export const matchZoneLineage = (context: SyncServiceContext) =>
    Effect.gen(function* () {
        context.transport.behavior.zoneMeta = metaWith(yield* (yield* SyncIdentityRepository).ensureLineageId());
    });

export const reconfigureAndAcknowledgeMeta = (context: SyncServiceContext, service: SyncServiceType) =>
    Effect.gen(function* () {
        yield* service.reconfigure;
        yield* service.handleSentChanges(sentEvent({ savedRecords: savedFrom(context.transport.calls.savedBatches[0], 'system-meta') }));
    });

export const flattenBatches = (batches: readonly (readonly ICloudRecordPayload[])[]) => batches.flat();

export const failedSaveOf = (
    payload: ICloudRecordPayload,
    code: ICloudErrorCode,
    message: string,
    serverRecord: ICloudSentChangesEvent['failedSaves'][number]['serverRecord']
) => ({
    zoneName: payload.zoneName,
    ownerName: payload.ownerName,
    recordName: payload.recordName,
    recordType: payload.recordType,
    code,
    isRetried: code === ICloudErrorCode.SERVICE_BUSY || code === ICloudErrorCode.NETWORK_UNAVAILABLE,
    message,
    serverRecord
});
