import { HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, SyncDatabaseScopeEnum, SyncRecordRepository, SyncZoneRoleEnum } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncApplyService } from '../../apply/service/sync-apply.service';
import { SyncAutomationService } from '../../automation/service/sync-automation.service';
import { HouseholdEndModeEnum } from '../../household/enum/household-end-mode.enum';
import { SyncRestoreReconciliationService } from '../../reconciliation/service/sync-restore-reconciliation.service';
import { ICloudSyncScope } from '../../transport/enum/icloud-sync-scope.enum';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncRestorePhaseEnum } from '../enum/cloud-sync-restore-phase.enum';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { cloudSyncDomainLayer } from '../layer/cloud-sync-domain.layer';
import { CloudSyncHost } from '../port/cloud-sync-host.port';
import { CloudSyncStateStore } from '../port/cloud-sync-state-store.port';
import { CloudSyncTransport } from '../port/cloud-sync-transport.port';
import { isCloudSyncSideRecordType } from '../utils/is-cloud-sync-side-record-type.util';
import { logAndContinue } from '../utils/log-and-continue.util';
import { toCloudSyncEnvelope } from '../utils/to-cloud-sync-envelope.util';

import { BankOwnershipService } from './bank-ownership.service';
import { CloudSyncDrainService } from './cloud-sync-drain.service';
import { CloudSyncHouseholdService } from './cloud-sync-household.service';
import { CloudSyncSessionState } from './cloud-sync-session-state.service';

import type { SyncApplyResultInterface } from '../../apply/interface/sync-apply-result.interface';
import type { SyncIncomingDeletionInterface } from '../../apply/interface/sync-incoming-deletion.interface';
import type { SyncIncomingRecordInterface } from '../../apply/interface/sync-incoming-record.interface';
import type { ICloudFetchedChangesEvent } from '../../transport/interface/icloud-fetched-changes-event.interface';
import type { ICloudScopedEvent } from '../../transport/interface/icloud-scoped-event.interface';
import type { ICloudStateSerializationEvent } from '../../transport/interface/icloud-state-serialization-event.interface';

export class CloudSyncFetchService extends Context.Service<CloudSyncFetchService>()('@budgie/cloud-sync/CloudSyncFetchService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const stateStore = yield* CloudSyncStateStore;
        const host = yield* CloudSyncHost;
        const applyService = yield* SyncApplyService;
        const recordRepository = yield* SyncRecordRepository;
        const reconciliationService = yield* SyncRestoreReconciliationService;
        const bankOwnershipService = yield* BankOwnershipService;
        const automationService = yield* SyncAutomationService;
        const state = yield* CloudSyncSessionState;
        const drainService = yield* CloudSyncDrainService;
        const householdService = yield* CloudSyncHouseholdService;
        const scope = ICloudSyncScope.PRIVATE;
        const { locked, lockedBatch, patch } = state;
        const { drainUnlocked, storeSideRecord } = drainService;

        const automate = (result: SyncApplyResultInterface) => logAndContinue(automationService.afterApply(result));

        const reconcileHouseholdZone = Effect.fnUntraced(function* (inventoryScope: ICloudSyncScope, zoneName: string) {
            const inventory = yield* transport.fetchZoneInventory(inventoryScope, zoneName).pipe(Effect.option);

            if (Option.isNone(inventory)) {
                return false;
            }

            const results = yield* reconciliationService.complete(
                HOUSEHOLD_SYNC_ZONE,
                new Set(inventory.value.map(({ recordName }) => recordName))
            );

            for (const result of results) {
                yield* automate(result);
            }

            return true;
        });

        const completeReconciliation = Effect.fnUntraced(function* () {
            const meta = yield* recordRepository.find(PERSONAL_SYNC_ZONE, CLOUD_SYNC_RECORDS.metaRecordName);
            const isInventoryFetched = isDefined(meta) && isDefined(meta.systemFields);

            const pausedZones = yield* applyService.findPausedZones;

            if (!isInventoryFetched || isNotEmptyArray(pausedZones)) {
                return;
            }

            const inventory = yield* transport.fetchZoneInventory(scope, CLOUD_SYNC_RECORDS.personalZoneName).pipe(Effect.option);

            if (Option.isNone(inventory)) {
                return;
            }

            const results = yield* reconciliationService.complete(
                PERSONAL_SYNC_ZONE,
                new Set(inventory.value.map(({ recordName }) => recordName))
            );

            yield* stateStore.update({ restorePhase: CloudSyncRestorePhaseEnum.NONE });
            yield* patch({ isReconciling: false });

            for (const result of results) {
                yield* automate(result);
            }

            const household = state.zones.get(HOUSEHOLD_SYNC_ZONE);

            if (household?.role === SyncZoneRoleEnum.OWNER) {
                if (!(yield* householdService.isHouseholdShareActive(household.zoneName))) {
                    yield* transport
                        .deleteZone(scope, household.zoneName)
                        .pipe(Effect.catchTags({ CloudSyncTransportError: () => Effect.void }));
                    yield* householdService.endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);

                    return;
                }

                yield* reconcileHouseholdZone(scope, household.zoneName);
            }
        });

        const completeSharedReconciliation = Effect.fnUntraced(function* () {
            const household = state.zones.get(HOUSEHOLD_SYNC_ZONE);

            if (
                household?.databaseScope === SyncDatabaseScopeEnum.SHARED &&
                (yield* reconcileHouseholdZone(ICloudSyncScope.SHARED, household.zoneName))
            ) {
                yield* patch({ isSharedReconciling: false });
            }
        });

        return {
            handleStateSerialization: (event: ICloudStateSerializationEvent) =>
                Effect.flatMap(Ref.get(state.isBatchFailed), isBatchFailed => {
                    if (isBatchFailed) {
                        return Effect.void;
                    }

                    return event.scope === ICloudSyncScope.SHARED
                        ? stateStore.update({ sharedStateSerialization: event.stateSerialization })
                        : stateStore.update({ stateSerialization: event.stateSerialization });
                }),
            handleWillFetch: (event: ICloudScopedEvent) =>
                event.scope === ICloudSyncScope.SHARED ? Effect.void : patch({ isFetching: true }),
            handleFetchedChanges: Effect.fn('CloudSyncFetchService.handleFetchedChanges')(function* (event: ICloudFetchedChangesEvent) {
                const records: SyncIncomingRecordInterface[] = [];
                const deletions: SyncIncomingDeletionInterface[] = [];

                for (const record of event.records) {
                    const label = state.labelOf(record);

                    if (isDefined(label) && isCloudSyncSideRecordType(record.recordType)) {
                        yield* storeSideRecord(toCloudSyncEnvelope(record, label), record.systemFields);
                    } else if (isDefined(label)) {
                        records.push({ record: toCloudSyncEnvelope(record, label), systemFields: record.systemFields });
                    }
                }

                for (const deletion of event.deletions) {
                    const label = state.labelOf(deletion);

                    if (isDefined(label) && !isCloudSyncSideRecordType(deletion.recordType)) {
                        deletions.push({ recordType: deletion.recordType, recordName: deletion.recordName, zone: label });
                    }
                }

                const result = yield* applyService.apply({ records, deletions });

                yield* Ref.update(state.session, current => {
                    const unblocked = current.blocked === CloudSyncStatusEnum.UPDATE_REQUIRED ? null : current.blocked;

                    return {
                        ...current,
                        fetchedRecordCount: current.fetchedRecordCount + event.records.length,
                        blocked: isNotEmptyArray(result.pausedZones) ? CloudSyncStatusEnum.UPDATE_REQUIRED : unblocked
                    };
                });
                yield* automate(result);

                if (isNotEmptyArray(event.changedShares)) {
                    yield* host.bumpHouseholdRefresh;
                }

                if (isNotEmptyArray(result.reenqueued)) {
                    yield* drainUnlocked();
                }

                yield* state.publish;
            }, lockedBatch),
            handleDidFetch: Effect.fn('CloudSyncFetchService.handleDidFetch')(function* (event: ICloudScopedEvent) {
                if (event.scope === ICloudSyncScope.SHARED) {
                    if ((yield* Ref.get(state.session)).isSharedReconciling) {
                        yield* completeSharedReconciliation();
                    }

                    yield* drainUnlocked();

                    return;
                }

                yield* patch({
                    isFetching: false,
                    isInitialFetchComplete: true,
                    lastSyncedAt: yield* Clock.currentTimeMillis
                });

                if ((yield* Ref.get(state.session)).isReconciling) {
                    yield* completeReconciliation();
                }

                for (const quotaKey of state.quotaKeys) {
                    state.failedKeys.delete(quotaKey);
                }

                state.quotaKeys.clear();
                yield* bankOwnershipService.evaluate();
                yield* drainUnlocked();
            }, locked)
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncFetchService, CloudSyncFetchService.make).pipe(
        Layer.provide([cloudSyncDomainLayer, CloudSyncSessionState.layer, CloudSyncDrainService.layer, CloudSyncHouseholdService.layer])
    );
}
