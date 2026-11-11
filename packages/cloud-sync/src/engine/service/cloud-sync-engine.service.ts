import {
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SettingsRepository,
    SyncDatabaseScopeEnum,
    SyncIdentityRepository,
    SyncResetRepository,
    logAndContinue
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isString } from '@rnw-community/shared';

import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { SyncOutboxRepository } from '../../outbox/repository/sync-outbox.repository';
import { SyncRestoreReconciliationService } from '../../reconciliation/service/sync-restore-reconciliation.service';
import { ICloudAccountChangeType } from '../../transport/enum/icloud-account-change-type.enum';
import { ICloudAccountStatusEnum } from '../../transport/enum/icloud-account-status.enum';
import { ICloudErrorCode } from '../../transport/enum/icloud-error-code.enum';
import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { ICloudZoneChangeReason } from '../../transport/enum/icloud-zone-change-reason.enum';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncLineageChoiceEnum } from '../enum/cloud-sync-lineage-choice.enum';
import { CloudSyncLineageDecisionEnum } from '../enum/cloud-sync-lineage-decision.enum';
import { CloudSyncRestorePhaseEnum } from '../enum/cloud-sync-restore-phase.enum';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncSafetyCopy } from '../port/cloud-sync-safety-copy.port';
import { CloudSyncStateStore } from '../port/cloud-sync-state-store.port';
import { CloudSyncTransport } from '../port/cloud-sync-transport.port';

import { CloudSyncDrainService } from './cloud-sync-drain.service';
import { CloudSyncHouseholdService } from './cloud-sync-household.service';
import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { ICloudAccountChangeEvent } from '../../transport/interface/icloud-account-change-event.interface';
import type { ICloudZoneChangeEvent } from '../../transport/interface/icloud-zone-change-event.interface';

export class CloudSyncEngineService extends Context.Service<CloudSyncEngineService>()('@budgie/cloud-sync/CloudSyncEngineService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const stateStore = yield* CloudSyncStateStore;
        const safetyCopy = yield* CloudSyncSafetyCopy;
        const host = yield* CloudSyncHost;
        const settingsRepository = yield* SettingsRepository;
        const applyService = yield* SyncApplyService;
        const outboxRepository = yield* SyncOutboxRepository;
        const identityRepository = yield* SyncIdentityRepository;
        const resetRepository = yield* SyncResetRepository;
        const reconciliationService = yield* SyncRestoreReconciliationService;
        const state = yield* CloudSyncSessionState;
        const drainService = yield* CloudSyncDrainService;
        const householdService = yield* CloudSyncHouseholdService;
        const scope = ICloudSyncScope.PRIVATE;
        const MetaFieldsSchema = Schema.Struct({ lineageId: Schema.String });
        const { locked, lockedBatch, patch, refreshZones } = state;
        const { drainUnlocked, pushSideRecord } = drainService;
        const { endHouseholdUnlocked, startSharedEngineUnlocked, discoverHouseholdUnlocked } = householdService;

        const stopEngineUnlocked = Effect.fnUntraced(function* () {
            yield* transport.stopSync(scope).pipe(Effect.catchTags({ CloudSyncTransportError: () => Effect.void }));

            if ((yield* Ref.get(state.session)).isSharedEngineRunning) {
                yield* transport.stopSync(ICloudSyncScope.SHARED).pipe(Effect.catchTags({ CloudSyncTransportError: () => Effect.void }));
            }

            state.clearTracking();
            yield* patch({
                isEngineRunning: false,
                isSharedEngineRunning: false,
                isAwaitingMeta: false,
                isReconciling: false,
                isSharedReconciling: false,
                isFetching: false
            });
        });

        const readZoneLineage = Effect.fnUntraced(function* () {
            const meta = yield* transport.fetchRecord(scope, CLOUD_SYNC_RECORDS.personalZoneName, CLOUD_SYNC_RECORDS.metaRecordName);

            return isDefined(meta)
                ? Option.map(Schema.decodeUnknownOption(MetaFieldsSchema)(meta.encryptedFields), ({ lineageId }) => lineageId)
                : Option.none<string>();
        });

        const decideLineage = Effect.fnUntraced(function* () {
            const stored = yield* stateStore.read;
            const localLineageId = yield* identityRepository.ensureLineageId();

            if (stored.resolvedLineageId === localLineageId) {
                return CloudSyncLineageDecisionEnum.JOIN;
            }

            const zoneLineageId = yield* readZoneLineage();

            if (Option.isNone(zoneLineageId)) {
                return CloudSyncLineageDecisionEnum.WRITE_META;
            }

            if (zoneLineageId.value === localLineageId) {
                yield* stateStore.update({ resolvedLineageId: localLineageId });

                return CloudSyncLineageDecisionEnum.JOIN;
            }

            if (yield* identityRepository.hasUserData()) {
                return CloudSyncLineageDecisionEnum.CONFLICT;
            }

            yield* identityRepository.adoptLineageId(zoneLineageId.value);
            yield* stateStore.update({ resolvedLineageId: zoneLineageId.value });

            return CloudSyncLineageDecisionEnum.JOIN;
        });

        const pauseForOtherAccountUnlocked = Effect.fnUntraced(function* () {
            yield* stopEngineUnlocked();
            yield* settingsRepository.update({ cloudUserRecordName: null });
            yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT });
        });

        const startEngineUnlocked = Effect.fnUntraced(function* (userRecordName: string) {
            const stored = yield* stateStore.read;

            if (isDefined(stored.boundUserRecordName) && stored.boundUserRecordName !== userRecordName) {
                yield* pauseForOtherAccountUnlocked();

                return;
            }

            if (!isDefined(stored.boundUserRecordName)) {
                yield* stateStore.update({ boundUserRecordName: userRecordName });
            }

            yield* settingsRepository.update({ cloudUserRecordName: userRecordName });

            yield* refreshZones();
            yield* householdService.refreshPrivateOwnerName();
            const resumed = yield* applyService.resume();
            yield* state.trackOwnerTransferRetries(resumed.ownerTransferRetries);
            yield* transport.ensureZone(scope, CLOUD_SYNC_RECORDS.personalZoneName);

            for (const zone of state.zones.values()) {
                if (zone.databaseScope === SyncDatabaseScopeEnum.PRIVATE && zone.zoneName !== CLOUD_SYNC_RECORDS.personalZoneName) {
                    yield* transport.ensureZone(scope, zone.zoneName);
                }
            }

            const decision = yield* decideLineage();

            if (decision === CloudSyncLineageDecisionEnum.CONFLICT) {
                yield* stopEngineUnlocked();
                yield* patch({ blocked: CloudSyncStatusEnum.LINEAGE_CONFLICT });

                return;
            }

            const isRestoring = stored.restorePhase !== CloudSyncRestorePhaseEnum.NONE;
            const isReconciling = isRestoring && decision === CloudSyncLineageDecisionEnum.JOIN;
            const stateSerialization = isRestoring ? null : stored.stateSerialization;

            if (decision === CloudSyncLineageDecisionEnum.WRITE_META) {
                if (isRestoring) {
                    yield* resetRepository.clearSyncState();
                    yield* stateStore.update({ stateSerialization: null, restorePhase: CloudSyncRestorePhaseEnum.NONE });
                }

                yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            }

            if (isReconciling) {
                yield* reconciliationService.prepare(stored.restorePhase === CloudSyncRestorePhaseEnum.PENDING);
                yield* stateStore.update({ stateSerialization: null, restorePhase: CloudSyncRestorePhaseEnum.FETCHING });
            }

            yield* Ref.set(state.isBatchFailed, false);
            const startedFrom = yield* transport.startSync(scope, stateSerialization).pipe(
                Effect.as(stateSerialization),
                Effect.catchTag('CloudSyncTransportError', error =>
                    error.code === ICloudErrorCode.INVALID_STATE
                        ? stateStore
                              .update({ stateSerialization: null })
                              .pipe(Effect.andThen(transport.startSync(scope, null)), Effect.as(null))
                        : Effect.fail(error)
                )
            );
            yield* patch({
                isEngineRunning: true,
                isAwaitingMeta: decision === CloudSyncLineageDecisionEnum.WRITE_META,
                isReconciling,
                blocked: null,
                isInitialFetchComplete: isDefined(startedFrom)
            });

            if (decision === CloudSyncLineageDecisionEnum.WRITE_META) {
                yield* pushSideRecord(CLOUD_SYNC_RECORDS.metaRecordType, CLOUD_SYNC_RECORDS.metaRecordName, {
                    lineageId: yield* identityRepository.ensureLineageId()
                });
            } else {
                yield* drainUnlocked();
            }

            yield* transport.syncNow(scope).pipe(logAndContinue, Effect.forkDetach);
            yield* startSharedEngineUnlocked(isRestoring);
        });

        const reconfigureUnlocked = Effect.fnUntraced(
            function* () {
                const settings = yield* settingsRepository.getSettings();

                if (!settings.cloudSyncEnabled) {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: null });

                    return;
                }

                if ((yield* identityRepository.countMissing()) > 0) {
                    return;
                }

                const account = yield* transport.getAccountStatus;

                if (account.status !== ICloudAccountStatusEnum.AVAILABLE) {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_SIGNED_OUT });

                    return;
                }

                if (!isString(account.userRecordName)) {
                    yield* patch({ blocked: CloudSyncStatusEnum.ERROR });

                    return;
                }

                const stored = yield* stateStore.read;
                const current = yield* Ref.get(state.session);

                if (current.isEngineRunning && stored.boundUserRecordName === account.userRecordName) {
                    return;
                }

                yield* startEngineUnlocked(account.userRecordName);
            },
            effect =>
                effect.pipe(
                    Effect.catchTags({
                        CloudSyncTransportError: error =>
                            patch({
                                isEngineRunning: false,
                                blocked:
                                    error.code === ICloudErrorCode.ACCOUNT_UNAVAILABLE
                                        ? CloudSyncStatusEnum.PAUSED_SIGNED_OUT
                                        : CloudSyncStatusEnum.ERROR
                            })
                    })
                )
        );

        const recoverZoneUnlocked = Effect.fnUntraced(function* () {
            yield* stopEngineUnlocked();
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: null, restorePhase: CloudSyncRestorePhaseEnum.NONE });
            yield* resetRepository.clearSyncState();
            yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            yield* reconfigureUnlocked();
        });

        const useCloudData = Effect.fnUntraced(function* () {
            yield* safetyCopy.create;
            yield* stopEngineUnlocked();

            const zoneLineageId = yield* readZoneLineage();

            if (Option.isNone(zoneLineageId)) {
                return;
            }

            yield* resetRepository.clearSyncedData();
            yield* settingsRepository.update({ isOnboardingCompleted: true, cloudSyncEnabled: true });
            yield* identityRepository.adoptLineageId(zoneLineageId.value);
            yield* stateStore.update({
                stateSerialization: null,
                resolvedLineageId: zoneLineageId.value,
                restorePhase: CloudSyncRestorePhaseEnum.NONE
            });
            yield* patch({ blocked: null, fetchedRecordCount: 0, isInitialFetchComplete: false });
            yield* reconfigureUnlocked();
        });

        const keepThisDevice = Effect.fnUntraced(function* () {
            yield* safetyCopy.create;
            yield* stopEngineUnlocked();
            yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.personalZoneName);
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: null, restorePhase: CloudSyncRestorePhaseEnum.NONE });
            yield* resetRepository.clearSyncState();
            yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            yield* patch({ blocked: null, fetchedRecordCount: 0, isInitialFetchComplete: false });
            yield* reconfigureUnlocked();
        });

        return {
            stopEngineUnlocked,
            reconfigureUnlocked,
            recoverZoneUnlocked,
            reconfigure: locked(reconfigureUnlocked()),
            resolveLineageConflict: Effect.fn('CloudSyncEngineService.resolveLineageConflict')(function* (
                choice: CloudSyncLineageChoiceEnum
            ) {
                yield* choice === CloudSyncLineageChoiceEnum.USE_ICLOUD_DATA ? useCloudData() : keepThisDevice();
                yield* discoverHouseholdUnlocked();
                yield* host.bumpHouseholdRefresh;
            }, locked),
            handleAccountChange: Effect.fn('CloudSyncEngineService.handleAccountChange')(function* (event: ICloudAccountChangeEvent) {
                if (event.scope === ICloudSyncScope.SHARED) {
                    return;
                }

                yield* host.bumpAccountRefresh;

                const stored = yield* stateStore.read;
                const current = yield* Ref.get(state.session);

                if (event.changeType === ICloudAccountChangeType.SIGN_OUT) {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_SIGNED_OUT });
                } else if (isDefined(stored.boundUserRecordName) && event.currentUserRecordName !== stored.boundUserRecordName) {
                    yield* pauseForOtherAccountUnlocked();
                } else if (!(current.isEngineRunning && event.changeType === ICloudAccountChangeType.SIGN_IN)) {
                    yield* stopEngineUnlocked();
                    yield* stateStore.update({ stateSerialization: null });
                    yield* patch({ blocked: null });
                    yield* reconfigureUnlocked();
                }
            }, lockedBatch),
            handleZoneChange: Effect.fn('CloudSyncEngineService.handleZoneChange')(function* (event: ICloudZoneChangeEvent) {
                const personalDeletions = event.deleted.filter(zone => state.labelOf(zone) === PERSONAL_SYNC_ZONE);
                const householdDeletions = event.deleted.filter(zone => state.labelOf(zone) === HOUSEHOLD_SYNC_ZONE);

                if (personalDeletions.some(zone => zone.reason === ICloudZoneChangeReason.ENCRYPTED_DATA_RESET)) {
                    yield* recoverZoneUnlocked();
                } else if (isNotEmptyArray(personalDeletions)) {
                    yield* stopEngineUnlocked();
                    yield* settingsRepository.update({ cloudSyncEnabled: false });
                }

                if (isNotEmptyArray(householdDeletions)) {
                    yield* endHouseholdUnlocked(state.householdEndMode());
                }
            }, lockedBatch)
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncEngineService, CloudSyncEngineService.make).pipe(
        Layer.provide([cloudSyncDomainLayer, CloudSyncSessionState.layer, CloudSyncDrainService.layer, CloudSyncHouseholdService.layer])
    );
}
