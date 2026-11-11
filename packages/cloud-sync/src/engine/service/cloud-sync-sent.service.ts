import { HOUSEHOLD_SYNC_ZONE, SyncIdentityRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { ICloudErrorCode } from '../../transport/enum/icloud-error-code.enum';
import { SyncUploadService } from '../../upload/service/sync-upload.service';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncStateStore } from '../port/cloud-sync-state-store.port';
import { buildCloudSyncKey } from '../utils/build-cloud-sync-key.util';
import { isCloudSyncSideRecordType } from '../utils/is-cloud-sync-side-record-type.util';
import { toCloudSyncEnvelope } from '../utils/to-cloud-sync-envelope.util';

import { CloudSyncDrainService } from './cloud-sync-drain.service';
import { CloudSyncEngineService } from './cloud-sync-engine.service';
import { CloudSyncHouseholdService } from './cloud-sync-household.service';
import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { ICloudFailedSave } from '../../transport/interface/icloud-failed-save.interface';
import type { ICloudSentChangesEvent } from '../../transport/interface/icloud-sent-changes-event.interface';

export class CloudSyncSentService extends Context.Service<CloudSyncSentService>()('@budgie/cloud-sync/CloudSyncSentService', {
    make: Effect.gen(function* () {
        const stateStore = yield* CloudSyncStateStore;
        const uploadService = yield* SyncUploadService;
        const applyService = yield* SyncApplyService;
        const identityRepository = yield* SyncIdentityRepository;
        const state = yield* CloudSyncSessionState;
        const drainService = yield* CloudSyncDrainService;
        const engineService = yield* CloudSyncEngineService;
        const householdService = yield* CloudSyncHouseholdService;
        const uploadLowWaterMark = 50;
        const { lockedBatch, patch } = state;
        const { drainUnlocked, storeSideRecord } = drainService;

        const isHouseholdLossCode = (code: ICloudErrorCode): boolean =>
            code === ICloudErrorCode.ZONE_NOT_FOUND ||
            code === ICloudErrorCode.USER_DELETED_ZONE ||
            code === ICloudErrorCode.PERMISSION_FAILURE ||
            code === ICloudErrorCode.ENCRYPTED_DATA_RESET;

        const acknowledgeComplete = Effect.fnUntraced(function* (itemKeys: ReadonlySet<string>) {
            const complete = [...itemKeys].flatMap(itemKey => {
                const item = state.pushed.get(itemKey);
                const isComplete =
                    isDefined(item) &&
                    item.records.every(record => item.savedSystemFields.has(buildCloudSyncKey(record.zone, record.recordName))) &&
                    item.deleteTargets.every(target => item.deletedKeys.has(buildCloudSyncKey(target.zone, target.recordName)));

                return isComplete ? [item] : [];
            });

            if (isNotEmptyArray(complete)) {
                yield* uploadService.acknowledge(
                    complete.map(item => ({
                        syncZone: item.syncZone,
                        syncId: item.syncId,
                        syncRevision: item.syncRevision,
                        sentRecords: item.records.map(record => ({
                            record,
                            systemFields: item.savedSystemFields.get(buildCloudSyncKey(record.zone, record.recordName)) ?? null
                        })),
                        deletedTargets: item.deleteTargets
                    }))
                );
                complete.forEach(item => {
                    state.dropItem(buildCloudSyncKey(item.syncZone, item.syncId));
                });
            }
        });

        const handleFailure = Effect.fnUntraced(function* (
            failure: Omit<ICloudFailedSave, 'recordType' | 'serverRecord'> & Partial<Pick<ICloudFailedSave, 'recordType' | 'serverRecord'>>
        ) {
            const label = state.labelOf(failure);

            if (!isDefined(label) || failure.isRetried) {
                return;
            }

            const recordKey = buildCloudSyncKey(label, failure.recordName);
            const isSideRecord = isDefined(failure.recordType) && isCloudSyncSideRecordType(failure.recordType);

            state.sidePending.delete(recordKey);

            if (label === HOUSEHOLD_SYNC_ZONE && isHouseholdLossCode(failure.code)) {
                yield* householdService.endHouseholdUnlocked(state.householdEndMode());

                return;
            }

            if (failure.code === ICloudErrorCode.ZONE_NOT_FOUND || failure.code === ICloudErrorCode.ENCRYPTED_DATA_RESET) {
                yield* engineService.recoverZoneUnlocked();

                return;
            }

            if (failure.code === ICloudErrorCode.SERVER_RECORD_CHANGED && isDefined(failure.serverRecord)) {
                const { serverRecord } = failure;

                if (isSideRecord) {
                    yield* storeSideRecord(toCloudSyncEnvelope(serverRecord, label), serverRecord.systemFields);

                    if ((yield* Ref.get(state.session)).isAwaitingMeta) {
                        yield* engineService.stopEngineUnlocked();
                        yield* engineService.reconfigureUnlocked();
                    }

                    return;
                }

                yield* applyService.resolveConflict({
                    record: toCloudSyncEnvelope(serverRecord, label),
                    systemFields: serverRecord.systemFields
                });
            }

            if (failure.recordType === CLOUD_SYNC_RECORDS.metaRecordType && (yield* Ref.get(state.session)).isAwaitingMeta) {
                yield* engineService.stopEngineUnlocked();
                yield* patch(
                    failure.code === ICloudErrorCode.QUOTA_EXCEEDED ? { isQuotaExceeded: true } : { blocked: CloudSyncStatusEnum.ERROR }
                );

                return;
            }

            const itemKey = state.itemKeyByRecordKey.get(recordKey);

            if (isDefined(itemKey)) {
                state.dropItem(itemKey);

                if (failure.code === ICloudErrorCode.QUOTA_EXCEEDED) {
                    state.failedKeys.add(itemKey);
                    state.quotaKeys.add(itemKey);
                    yield* patch({ isQuotaExceeded: true });
                } else if (failure.code !== ICloudErrorCode.SERVER_RECORD_CHANGED) {
                    state.failedKeys.add(itemKey);

                    if (failure.code !== ICloudErrorCode.UNKNOWN_ITEM) {
                        yield* patch({ blocked: CloudSyncStatusEnum.ERROR });
                    }
                }
            }
        });

        return {
            handleSentChanges: Effect.fn('CloudSyncSentService.handleSentChanges')(function* (event: ICloudSentChangesEvent) {
                const touched = new Set<string>();

                for (const saved of event.savedRecords) {
                    const label = state.labelOf(saved);

                    if (isDefined(label)) {
                        const recordKey = buildCloudSyncKey(label, saved.recordName);
                        const sideEnvelope = state.sidePending.get(recordKey);

                        if (isDefined(sideEnvelope)) {
                            state.sidePending.delete(recordKey);
                            yield* storeSideRecord(sideEnvelope, saved.systemFields);

                            if (saved.recordType === CLOUD_SYNC_RECORDS.metaRecordType) {
                                const lineageId = yield* identityRepository.ensureLineageId();

                                yield* stateStore.update({ resolvedLineageId: lineageId });
                                yield* patch({ isAwaitingMeta: false });
                            }
                        } else {
                            const itemKey = state.itemKeyByRecordKey.get(recordKey);

                            if (isDefined(itemKey)) {
                                state.pushed.get(itemKey)?.savedSystemFields.set(recordKey, saved.systemFields);
                                touched.add(itemKey);
                            }
                        }
                    }
                }

                const deletedIds = [
                    ...event.deletedRecords,
                    ...event.failedDeletes.filter(failed => failed.code === ICloudErrorCode.UNKNOWN_ITEM)
                ];

                for (const deleted of deletedIds) {
                    const label = state.labelOf(deleted);
                    const recordKey = isDefined(label) ? buildCloudSyncKey(label, deleted.recordName) : null;
                    const itemKey = isDefined(recordKey) ? state.itemKeyByRecordKey.get(recordKey) : void 0;

                    if (isDefined(recordKey) && isDefined(itemKey)) {
                        state.pushed.get(itemKey)?.deletedKeys.add(recordKey);
                        touched.add(itemKey);
                    }
                }

                for (const failure of event.failedSaves) {
                    yield* handleFailure(failure);
                }

                for (const failure of event.failedDeletes) {
                    if (failure.code !== ICloudErrorCode.UNKNOWN_ITEM) {
                        yield* handleFailure(failure);
                    }
                }

                yield* acknowledgeComplete(touched);

                if (isNotEmptyArray(event.savedRecords) && state.quotaKeys.size === 0) {
                    yield* patch({ isQuotaExceeded: false });
                }

                if (state.pushed.size <= uploadLowWaterMark) {
                    yield* drainUnlocked();
                }

                yield* state.publish;
            }, lockedBatch)
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncSentService, CloudSyncSentService.make).pipe(
        Layer.provide([
            cloudSyncDomainLayer,
            CloudSyncSessionState.layer,
            CloudSyncDrainService.layer,
            CloudSyncEngineService.layer,
            CloudSyncHouseholdService.layer
        ])
    );
}
