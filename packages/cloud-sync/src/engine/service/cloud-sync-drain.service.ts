import { PERSONAL_SYNC_ZONE, SyncRecordRepository } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { SYNC_RECORD_SCHEMA_VERSION } from '../../mapping/constant/sync-record-schema-version.constant';
import { listClearedSyncFields } from '../../mapping/utils/list-cleared-sync-fields.util';
import { HouseholdShareService } from '../../share/service/household-share.service';
import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { SyncUploadService } from '../../upload/service/sync-upload.service';
import { CloudSyncDeviceRecordSchema } from '../constant/cloud-sync-device-record-schema.constant';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncErrorReasonEnum } from '../enum/cloud-sync-error-reason.enum';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncInstallId } from '../port/cloud-sync-install-id.port';
import { CloudSyncTransport } from '../port/cloud-sync-transport.port';
import { buildCloudSyncKey } from '../utils/build-cloud-sync-key.util';

import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { ICloudRecordId } from '../../transport/interface/icloud-record-id.interface';
import type { ICloudRecordPayload } from '../../transport/interface/icloud-record-payload.interface';
import type { CloudSyncEnvelopeInterface } from '../interface/cloud-sync-envelope.interface';
import type { CloudSyncPushedItemInterface } from '../interface/cloud-sync-pushed-item.interface';

export class CloudSyncDrainService extends Context.Service<CloudSyncDrainService>()('@budgie/cloud-sync/CloudSyncDrainService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const host = yield* CloudSyncHost;
        const getInstallId = yield* CloudSyncInstallId;
        const uploadService = yield* SyncUploadService;
        const applyService = yield* SyncApplyService;
        const recordRepository = yield* SyncRecordRepository;
        const householdShareService = yield* HouseholdShareService;
        const state = yield* CloudSyncSessionState;
        const scope = ICloudSyncScope.PRIVATE;
        const uploadBatchSize = 200;
        const heartbeatIntervalMilliseconds = 24 * 60 * 60 * 1000;

        const storeSideRecord = (envelope: CloudSyncEnvelopeInterface, systemFields: string | null) =>
            recordRepository.upsert({
                syncZone: envelope.zone,
                syncId: envelope.recordName,
                recordType: envelope.recordType,
                systemFields,
                payload: JSON.stringify(envelope),
                schemaVersion: envelope.schemaVersion
            });

        const buildPayload = Effect.fnUntraced(function* (record: CloudSyncEnvelopeInterface, clearable: readonly string[]) {
            const zone = state.zones.get(record.zone);

            if (!isDefined(zone)) {
                return null;
            }

            const stored = yield* recordRepository.find(record.zone, record.recordName);
            const systemFields = stored?.systemFields ?? null;

            return {
                zoneName: zone.zoneName,
                ownerName: zone.ownerName,
                recordName: record.recordName,
                recordType: record.recordType,
                systemFields,
                schemaVersion: record.schemaVersion,
                encryptedFields: isDefined(systemFields)
                    ? { ...record.encryptedFields, ...Object.fromEntries(clearable.map(field => [field, null])) }
                    : record.encryptedFields
            } satisfies ICloudRecordPayload;
        });

        const pushSideRecord = Effect.fnUntraced(function* (
            recordType: string,
            recordName: string,
            encryptedFields: Readonly<Record<string, string | number>>
        ) {
            const envelope: CloudSyncEnvelopeInterface = {
                recordType,
                recordName,
                zone: PERSONAL_SYNC_ZONE,
                schemaVersion: SYNC_RECORD_SCHEMA_VERSION,
                encryptedFields
            };
            const payload = yield* buildPayload(envelope, []);

            if (isDefined(payload)) {
                state.sidePending.set(buildCloudSyncKey(envelope.zone, recordName), envelope);
                yield* transport.addPendingSaves(scope, [payload]);
            }
        });

        const pushHeartbeat = Effect.fnUntraced(function* () {
            const installId = yield* getInstallId;
            const now = yield* Clock.currentTimeMillis;
            const stored = yield* recordRepository.find(PERSONAL_SYNC_ZONE, installId);
            const lastSyncedAt = Option.match(Schema.decodeUnknownOption(CloudSyncDeviceRecordSchema)(stored?.payload), {
                onNone: () => 0,
                onSome: ({ encryptedFields }) => encryptedFields.lastSyncedAt
            });

            if (
                now - lastSyncedAt >= heartbeatIntervalMilliseconds &&
                !state.sidePending.has(buildCloudSyncKey(PERSONAL_SYNC_ZONE, installId))
            ) {
                yield* pushSideRecord(CLOUD_SYNC_RECORDS.deviceRecordType, installId, {
                    installId,
                    lastSyncedAt: now,
                    deviceName: host.deviceName
                });
            }
        });

        const drainUnlocked = Effect.fnUntraced(function* () {
            const current = yield* Ref.get(state.session);
            const isPrivateReady = current.isEngineRunning && !current.isAwaitingMeta && !current.isReconciling;

            const isSharedReady = current.isSharedEngineRunning && !current.isSharedReconciling;

            if (!isPrivateReady && !isSharedReady) {
                return;
            }

            const canSendTo = (label: string): boolean =>
                state.scopeOf(label) === ICloudSyncScope.SHARED ? isSharedReady : isPrivateReady;
            const pausedZones = new Set((yield* applyService.findPausedZones).map(({ syncZone }) => syncZone));
            yield* householdShareService.reconcile();

            const sendableZones = [...state.zones.keys()].filter(label => !pausedZones.has(label) && canSendTo(label));
            const skippedKeys = new Set([...state.pushed.keys(), ...state.failedKeys]);
            const privateOwnerName = yield* Ref.get(state.privateOwnerName);
            const batch = isEmptyArray(sendableZones)
                ? { saves: [], deletions: [], rejections: [] }
                : yield* uploadService.pending(
                      skippedKeys.size + state.heldKeys.size + uploadBatchSize,
                      skippedKeys,
                      sendableZones,
                      privateOwnerName
                  );
            const payloadsByScope = new Map<ICloudSyncScope, ICloudRecordPayload[]>();
            const deleteIdsByScope = new Map<ICloudSyncScope, ICloudRecordId[]>();

            state.heldKeys.clear();
            for (const rejection of batch.rejections) {
                state.failedKeys.add(buildCloudSyncKey(rejection.syncZone, rejection.syncId));
                yield* state.patch({ blocked: CloudSyncStatusEnum.ERROR, errorReason: CloudSyncErrorReasonEnum.CHANGES_REJECTED });
            }

            const register = (item: CloudSyncPushedItemInterface): void => {
                const itemKey = buildCloudSyncKey(item.syncZone, item.syncId);

                state.pushed.set(itemKey, item);
                item.records.forEach(record => state.itemKeyByRecordKey.set(buildCloudSyncKey(record.zone, record.recordName), itemKey));
                item.deleteTargets.forEach(target =>
                    state.itemKeyByRecordKey.set(buildCloudSyncKey(target.zone, target.recordName), itemKey)
                );
            };

            const collectDeleteIds = (targets: readonly { readonly recordName: string; readonly zone: string }[]): void => {
                for (const target of targets) {
                    const zone = state.zones.get(target.zone);

                    if (isDefined(zone)) {
                        const targetScope = state.scopeOf(target.zone);

                        deleteIdsByScope.set(targetScope, [
                            ...(deleteIdsByScope.get(targetScope) ?? []),
                            { zoneName: zone.zoneName, ownerName: zone.ownerName, recordName: target.recordName }
                        ]);
                    }
                }
            };

            for (const save of batch.saves) {
                const itemKey = buildCloudSyncKey(save.syncZone, save.syncId);
                const isBlocked = save.records.some(
                    record => pausedZones.has(record.zone) || !state.zones.has(record.zone) || !canSendTo(record.zone)
                );

                if (isBlocked) {
                    state.heldKeys.add(itemKey);
                } else {
                    for (const record of save.records) {
                        const payload = yield* buildPayload(record, listClearedSyncFields(record));

                        if (isDefined(payload)) {
                            const payloadScope = state.scopeOf(record.zone);

                            payloadsByScope.set(payloadScope, [...(payloadsByScope.get(payloadScope) ?? []), payload]);
                        }
                    }

                    collectDeleteIds(save.staleTargets);
                    register({
                        syncZone: save.syncZone,
                        syncId: save.syncId,
                        syncRevision: save.syncRevision,
                        records: save.records,
                        deleteTargets: save.staleTargets,
                        savedSystemFields: new Map(),
                        deletedKeys: new Set()
                    });
                }
            }

            for (const deletion of batch.deletions) {
                const itemKey = buildCloudSyncKey(deletion.syncZone, deletion.syncId);
                const isBlocked = deletion.targets.some(
                    target => pausedZones.has(target.zone) || !state.zones.has(target.zone) || !canSendTo(target.zone)
                );

                if (isBlocked) {
                    state.heldKeys.add(itemKey);
                } else {
                    collectDeleteIds(deletion.targets);
                    register({
                        syncZone: deletion.syncZone,
                        syncId: deletion.syncId,
                        syncRevision: deletion.syncRevision,
                        records: [],
                        deleteTargets: deletion.targets,
                        savedSystemFields: new Map(),
                        deletedKeys: new Set()
                    });
                }
            }

            for (const [targetScope, payloads] of payloadsByScope) {
                yield* transport.addPendingSaves(targetScope, payloads);
            }

            for (const [targetScope, deleteIds] of deleteIdsByScope) {
                yield* transport.addPendingDeletes(targetScope, deleteIds);
            }

            if (isPrivateReady) {
                yield* pushHeartbeat();
            }

            yield* state.publish;
        });

        return {
            storeSideRecord,
            pushSideRecord,
            drainUnlocked,
            drain: state.locked(drainUnlocked())
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncDrainService, CloudSyncDrainService.make).pipe(
        Layer.provide([cloudSyncDomainLayer, CloudSyncSessionState.layer])
    );
}
