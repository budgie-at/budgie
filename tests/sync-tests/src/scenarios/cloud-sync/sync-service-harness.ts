import { BankOwnershipService } from '@app/cloud-sync/service/bank-ownership.service';
import { CloudSyncSafetyCopyService } from '@app/cloud-sync/service/cloud-sync-safety-copy.service';
import { CloudSyncStateStore } from '@app/cloud-sync/service/cloud-sync-state-store.service';
import { CloudSyncTransport } from '@app/cloud-sync/service/cloud-sync-transport.service';
import { CloudSyncService } from '@app/cloud-sync/service/cloud-sync.service';
import { syncAccountBalanceRefresherLayer } from '@app/cloud-sync/layer/sync-account-balance-refresher.layer';
import { DatabaseChangeService } from '@app/@generic/drizzle/service/database-change.service';
import { InstallIdService } from '@app/cloud-backup/service/install-id.service';
import {
    BankIntegrationRepository,
    Db,
    SettingsRepository,
    SyncApplyService,
    SyncIdentityRepository,
    SyncOutboxRepository,
    SyncRecordRepository,
    SyncRepository,
    SyncResetRepository,
    SyncUploadService,
    SyncZoneRegistryRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Stream from 'effect/Stream';

import { ICloudSyncScope } from '../../../../../packages/app/modules/icloud';

import { testDb } from '../../harness';

import type { CloudSyncStateInterface } from '@app/cloud-sync/interface/cloud-sync-state.interface';
import type {
    ICloudAccountStatusResult,
    ICloudFetchedRecord,
    ICloudRecordId,
    ICloudRecordPayload,
    ICloudSentChangesEvent
} from '../../../../../packages/app/modules/icloud';

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
}

interface FakeTransportBehaviorInterface {
    accountStatus: ICloudAccountStatusResult;
    zoneMeta: ICloudFetchedRecord | null;
    confirmProbeSql: string;
}

export const makeFakeTransport = () => {
    const calls: FakeTransportCallsInterface = {
        started: [],
        stopped: 0,
        savedBatches: [],
        deletedBatches: [],
        confirmed: [],
        deletedZones: [],
        ensuredZones: [],
        confirmProbe: []
    };
    const behavior: FakeTransportBehaviorInterface = {
        accountStatus: { status: 'available', userRecordName: 'user-a' },
        zoneMeta: null,
        confirmProbeSql: 'SELECT COUNT(*) AS total FROM accounts'
    };

    const layer = Layer.succeed(CloudSyncTransport, {
        events: Stream.empty,
        getAccountStatus: () => Effect.sync(() => behavior.accountStatus),
        startSync: (_scope: ICloudSyncScope, state: string | null) =>
            Effect.sync(() => {
                calls.started.push(state);
            }),
        stopSync: () =>
            Effect.sync(() => {
                calls.stopped += 1;
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
        addPendingSaves: (_scope: ICloudSyncScope, records: readonly ICloudRecordPayload[]) =>
            Effect.sync(() => {
                calls.savedBatches.push([...records]);
            }),
        addPendingDeletes: (_scope: ICloudSyncScope, recordIds: readonly ICloudRecordId[]) =>
            Effect.sync(() => {
                calls.deletedBatches.push([...recordIds]);
            }),
        confirmFetchedBatch: (_scope: ICloudSyncScope, batchId: string) =>
            testDb.$client.unsafe<{ readonly total: number }>(behavior.confirmProbeSql).pipe(
                Effect.orDie,
                Effect.map(([row]) => {
                    calls.confirmProbe.push(row.total);
                    calls.confirmed.push(batchId);
                })
            )
    });

    return { calls, behavior, layer };
};

export const makeFakeStateStore = () => {
    const holder: { state: CloudSyncStateInterface } = {
        state: { boundUserRecordName: null, stateSerialization: null, resolvedLineageId: null }
    };
    const layer = Layer.succeed(CloudSyncStateStore, {
        read: Effect.sync(() => holder.state),
        update: (patch: Partial<CloudSyncStateInterface>) =>
            Effect.sync(() => {
                holder.state = { ...holder.state, ...patch };
            }),
        clear: Effect.sync(() => {
            holder.state = { boundUserRecordName: null, stateSerialization: null, resolvedLineageId: null };
        })
    });

    return { holder, layer };
};

export const makeFakeSafetyCopy = () => {
    const holder = { created: 0 };
    const layer = Layer.succeed(CloudSyncSafetyCopyService, {
        create: () =>
            Effect.sync(() => {
                holder.created += 1;
            })
    });

    return { holder, layer };
};

export const installIdLayer = Layer.succeed(InstallIdService, { get: Effect.succeed(INSTALL_ID) });

export const makeSyncServiceContext = () => {
    const transport = makeFakeTransport();
    const store = makeFakeStateStore();
    const safetyCopy = makeFakeSafetyCopy();
    const dependencies = Layer.mergeAll(
        transport.layer,
        store.layer,
        safetyCopy.layer,
        installIdLayer,
        SettingsRepository.layer,
        SyncUploadService.layer,
        SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)),
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
        Effect.andThen(testDb.$client.unsafe('UPDATE settings SET lineage_id = NULL'), effect).pipe(
            Effect.provide(layer),
            Effect.provideService(Db, testDb)
        );

    return { transport, store, safetyCopy, run };
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
