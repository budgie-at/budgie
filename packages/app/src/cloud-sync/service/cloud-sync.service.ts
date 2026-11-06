import {
    HOUSEHOLD_SYNC_ZONE,
    HouseholdMembershipService,
    HouseholdShareService,
    PERSONAL_SYNC_ZONE,
    SYNC_IDENTITY_TABLES,
    SYNC_RECORD_SCHEMA_VERSION,
    SettingsRepository,
    SyncApplyService,
    SyncDatabaseScopeEnum,
    SyncIdentityRepository,
    SyncOutboxRepository,
    SyncRecordRepository,
    SyncResetRepository,
    SyncRestoreReconciliationService,
    SyncUploadService,
    SyncZoneRoleEnum,
    SyncZoneRegistryRepository,
    listClearedSyncFields
} from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import Constants from 'expo-constants';

import { isDefined, isNotEmptyArray, isString } from '@rnw-community/shared';

import {
    ICLOUD_DEFAULT_OWNER_NAME,
    ICloudAccountChangeType,
    ICloudErrorCode,
    ICloudShareChange,
    ICloudShareOutcome,
    ICloudSyncScope,
    ICloudZoneChangeReason
} from '../../../modules/icloud';
import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { appStateChanges } from '../../@generic/constant/app-state-changes.constant';
import { DatabaseChangeService } from '../../@generic/drizzle/service/database-change.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { iCloudAccountRefreshAtom } from '../../cloud-backup/constant/icloud-account-refresh-atom.constant';
import { InstallIdService } from '../../cloud-backup/service/install-id.service';
import { syncAutomationEmbeddingBoostLayer } from '../../cloud-sync-automation/layer/sync-automation-embedding-boost.layer';
import { SyncAutomationService } from '../../cloud-sync-automation/service/sync-automation.service';
import { householdRefreshAtom } from '../../household/constant/household-refresh-atom.constant';
import { householdStateAtom } from '../../household/constant/household-state-atom.constant';
import { HouseholdEndModeEnum } from '../../household/enum/household-end-mode.enum';
import { HouseholdRoleEnum } from '../../household/enum/household-role.enum';
import { CloudSyncDeviceRecordSchema } from '../constant/cloud-sync-device-record-schema.constant';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';
import { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';
import { CloudSyncLineageChoiceEnum } from '../enum/cloud-sync-lineage-choice.enum';
import { CloudSyncLineageDecisionEnum } from '../enum/cloud-sync-lineage-decision.enum';
import { CloudSyncRestorePhaseEnum } from '../enum/cloud-sync-restore-phase.enum';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';
import { syncAccountBalanceRefresherLayer } from '../layer/sync-account-balance-refresher.layer';

import { BankOwnershipService } from './bank-ownership.service';
import { CloudSyncSafetyCopyService } from './cloud-sync-safety-copy.service';
import { CloudSyncStateStore } from './cloud-sync-state-store.service';
import { CloudSyncTransport } from './cloud-sync-transport.service';

import type {
    ICloudAccountChangeEvent,
    ICloudFailedSave,
    ICloudFetchedChangesEvent,
    ICloudFetchedRecord,
    ICloudRecordId,
    ICloudRecordPayload,
    ICloudScopedEvent,
    ICloudSentChangesEvent,
    ICloudShareAcceptedEvent,
    ICloudShareChangedEvent,
    ICloudStateSerializationEvent,
    ICloudZoneChangeEvent
} from '../../../modules/icloud';
import type { CloudSyncEnvelopeInterface } from '../interface/cloud-sync-envelope.interface';
import type { CloudSyncPushedItemInterface } from '../interface/cloud-sync-pushed-item.interface';
import type { CloudSyncSessionInterface } from '../interface/cloud-sync-session.interface';
import type { CloudSyncEventType } from '../type/cloud-sync-event.type';
import type {
    SyncApplyResultInterface,
    SyncIncomingDeletionInterface,
    SyncIncomingRecordInterface,
    SyncZoneRegistryEntityInterface
} from '@budgie/contracts';

export class CloudSyncService extends Context.Service<CloudSyncService>()('@budgie/app/CloudSyncService', {
    make: Effect.gen(function* () {
        const transport = yield* CloudSyncTransport;
        const stateStore = yield* CloudSyncStateStore;
        const installIdService = yield* InstallIdService;
        const settingsRepository = yield* SettingsRepository;
        const uploadService = yield* SyncUploadService;
        const applyService = yield* SyncApplyService;
        const outboxRepository = yield* SyncOutboxRepository;
        const recordRepository = yield* SyncRecordRepository;
        const zoneRegistryRepository = yield* SyncZoneRegistryRepository;
        const identityRepository = yield* SyncIdentityRepository;
        const resetRepository = yield* SyncResetRepository;
        const bankOwnershipService = yield* BankOwnershipService;
        const databaseChangeService = yield* DatabaseChangeService;
        const safetyCopyService = yield* CloudSyncSafetyCopyService;
        const reconciliationService = yield* SyncRestoreReconciliationService;
        const householdMembershipService = yield* HouseholdMembershipService;
        const householdShareService = yield* HouseholdShareService;
        const automationService = yield* SyncAutomationService;
        const lock = yield* Semaphore.make(1);
        const locked = lock.withPermits(1);
        const session = yield* Ref.make<CloudSyncSessionInterface>({
            isEngineRunning: false,
            isSharedEngineRunning: false,
            isAwaitingMeta: false,
            isReconciling: false,
            isSharedReconciling: false,
            isQuotaExceeded: false,
            isFetching: false,
            blocked: null,
            lastSyncedAt: null,
            fetchedRecordCount: 0,
            isInitialFetchComplete: false
        });
        const scope = ICloudSyncScope.PRIVATE;
        const uploadBatchSize = 200;
        const uploadLowWaterMark = 50;
        const heartbeatIntervalMilliseconds = Duration.toMillis(Duration.hours(24));
        const localWriteDebounce = Duration.seconds(2);
        const settingsDebounce = Duration.millis(500);
        const userDataTableNames = new Set(SYNC_IDENTITY_TABLES.map(table => table.name));
        const MetaFieldsSchema = Schema.Struct({ lineageId: Schema.String });
        const zones = new Map<string, Pick<SyncZoneRegistryEntityInterface, 'databaseScope' | 'ownerName' | 'role' | 'zoneName'>>();
        const labelByZone = new Map<string, string>();
        const pushed = new Map<string, CloudSyncPushedItemInterface>();
        const itemKeyByRecordKey = new Map<string, string>();
        const sidePending = new Map<string, CloudSyncEnvelopeInterface>();
        const heldKeys = new Set<string>();
        const failedKeys = new Set<string>();
        const quotaKeys = new Set<string>();

        const keyOf = (zone: string, name: string): string => `${zone}|${name}`;

        const scopeOf = (label: string): ICloudSyncScope =>
            zones.get(label)?.databaseScope === SyncDatabaseScopeEnum.SHARED ? ICloudSyncScope.SHARED : ICloudSyncScope.PRIVATE;

        const householdEndMode = (): HouseholdEndModeEnum =>
            zones.get(HOUSEHOLD_SYNC_ZONE)?.role === SyncZoneRoleEnum.PARTICIPANT
                ? HouseholdEndModeEnum.DROP
                : HouseholdEndModeEnum.KEEP_PERSONAL_COPY;

        const bumpHouseholdRefresh = Effect.sync(() => {
            appAtomRegistry.update(householdRefreshAtom, count => count + 1);
        });

        const publish = Effect.flatMap(Ref.get(session), current =>
            Effect.sync(() => {
                appAtomRegistry.set(cloudSyncStatusAtom, {
                    status:
                        current.blocked ?? (current.isFetching || pushed.size > 0 ? CloudSyncStatusEnum.SYNCING : CloudSyncStatusEnum.IDLE),
                    lastSyncedAt: current.lastSyncedAt,
                    fetchedRecordCount: current.fetchedRecordCount,
                    isInitialFetchComplete: current.isInitialFetchComplete,
                    isQuotaExceeded: current.isQuotaExceeded
                });

                const household = zones.get(HOUSEHOLD_SYNC_ZONE);
                const role = isDefined(household)
                    ? household.role === SyncZoneRoleEnum.OWNER
                        ? HouseholdRoleEnum.OWNER
                        : HouseholdRoleEnum.MEMBER
                    : HouseholdRoleEnum.NONE;
                const isReady =
                    isDefined(household) &&
                    (household.databaseScope === SyncDatabaseScopeEnum.SHARED ? current.isSharedEngineRunning : current.isEngineRunning);
                const previous = appAtomRegistry.get(householdStateAtom);

                if (previous.role !== role || previous.isReady !== isReady) {
                    appAtomRegistry.set(householdStateAtom, { role, isReady });
                }
            })
        );

        const patch = (partial: Partial<CloudSyncSessionInterface>) =>
            Ref.update(session, current => ({ ...current, ...partial })).pipe(Effect.andThen(publish));

        const refreshZones = Effect.fnUntraced(function* () {
            yield* zoneRegistryRepository.upsert({
                zoneLabel: PERSONAL_SYNC_ZONE,
                zoneName: CLOUD_SYNC_RECORDS.personalZoneName,
                ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                role: SyncZoneRoleEnum.OWNER
            });
            zones.clear();
            labelByZone.clear();

            for (const zone of yield* zoneRegistryRepository.findAll()) {
                zones.set(zone.zoneLabel, zone);
                labelByZone.set(keyOf(zone.ownerName, zone.zoneName), zone.zoneLabel);
            }

            yield* publish;
        });

        const labelOf = (id: Pick<ICloudRecordId, 'ownerName' | 'zoneName'>): string | undefined =>
            labelByZone.get(keyOf(id.ownerName, id.zoneName));

        const toEnvelope = (
            record: Pick<ICloudFetchedRecord, 'encryptedFields' | 'recordName' | 'recordType' | 'schemaVersion'>,
            zone: string
        ) => ({
            recordType: record.recordType,
            recordName: record.recordName,
            zone,
            schemaVersion: record.schemaVersion,
            encryptedFields: record.encryptedFields
        });

        const isSideRecordType = (recordType: string): boolean =>
            recordType === CLOUD_SYNC_RECORDS.metaRecordType || recordType === CLOUD_SYNC_RECORDS.deviceRecordType;

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
            const zone = zones.get(record.zone);

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
                sidePending.set(keyOf(envelope.zone, recordName), envelope);
                yield* transport.addPendingSaves(scope, [payload]);
            }
        });

        const pushHeartbeat = Effect.fnUntraced(function* () {
            const installId = yield* installIdService.get;
            const now = yield* Clock.currentTimeMillis;
            const stored = yield* recordRepository.find(PERSONAL_SYNC_ZONE, installId);
            const lastSyncedAt = Option.match(Schema.decodeUnknownOption(CloudSyncDeviceRecordSchema)(stored?.payload), {
                onNone: () => 0,
                onSome: ({ encryptedFields }) => encryptedFields.lastSyncedAt
            });

            if (now - lastSyncedAt >= heartbeatIntervalMilliseconds && !sidePending.has(keyOf(PERSONAL_SYNC_ZONE, installId))) {
                yield* pushSideRecord(CLOUD_SYNC_RECORDS.deviceRecordType, installId, {
                    installId,
                    lastSyncedAt: now,
                    deviceName: Constants.deviceName ?? ''
                });
            }
        });

        const dropItem = (itemKey: string): void => {
            const item = pushed.get(itemKey);

            item?.records.forEach(record => itemKeyByRecordKey.delete(keyOf(record.zone, record.recordName)));
            item?.deleteTargets.forEach(target => itemKeyByRecordKey.delete(keyOf(target.zone, target.recordName)));
            pushed.delete(itemKey);
        };

        const drainUnlocked = Effect.fnUntraced(function* () {
            const current = yield* Ref.get(session);
            const isPrivateReady = current.isEngineRunning && !current.isAwaitingMeta && !current.isReconciling;

            if (!isPrivateReady && !current.isSharedEngineRunning) {
                return;
            }

            const canSendTo = (label: string): boolean =>
                scopeOf(label) === ICloudSyncScope.SHARED ? current.isSharedEngineRunning : isPrivateReady;
            const pausedZones = new Set((yield* applyService.findPausedZones()).map(({ syncZone }) => syncZone));
            yield* householdShareService.reconcile();

            const batch = yield* uploadService.pending(pushed.size + heldKeys.size + failedKeys.size + uploadBatchSize);
            const payloadsByScope = new Map<ICloudSyncScope, ICloudRecordPayload[]>();
            const deleteIdsByScope = new Map<ICloudSyncScope, ICloudRecordId[]>();

            heldKeys.clear();
            batch.rejections.forEach(rejection => heldKeys.add(keyOf(rejection.syncZone, rejection.syncId)));

            const register = (item: CloudSyncPushedItemInterface): void => {
                const itemKey = keyOf(item.syncZone, item.syncId);

                pushed.set(itemKey, item);
                item.records.forEach(record => itemKeyByRecordKey.set(keyOf(record.zone, record.recordName), itemKey));
                item.deleteTargets.forEach(target => itemKeyByRecordKey.set(keyOf(target.zone, target.recordName), itemKey));
            };

            const collectDeleteIds = (targets: readonly { readonly recordName: string; readonly zone: string }[]): void => {
                for (const target of targets) {
                    const zone = zones.get(target.zone);

                    if (isDefined(zone)) {
                        const targetScope = scopeOf(target.zone);

                        deleteIdsByScope.set(targetScope, [
                            ...(deleteIdsByScope.get(targetScope) ?? []),
                            { zoneName: zone.zoneName, ownerName: zone.ownerName, recordName: target.recordName }
                        ]);
                    }
                }
            };

            for (const save of batch.saves) {
                const itemKey = keyOf(save.syncZone, save.syncId);
                const isBlocked = save.records.some(
                    record => pausedZones.has(record.zone) || !zones.has(record.zone) || !canSendTo(record.zone)
                );

                if (pushed.has(itemKey) || failedKeys.has(itemKey)) {
                    continue;
                }

                if (isBlocked) {
                    heldKeys.add(itemKey);
                    continue;
                }

                for (const record of save.records) {
                    const payload = yield* buildPayload(record, listClearedSyncFields(record));

                    if (isDefined(payload)) {
                        const payloadScope = scopeOf(record.zone);

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

            for (const deletion of batch.deletions) {
                const itemKey = keyOf(deletion.syncZone, deletion.syncId);

                if (pushed.has(itemKey) || failedKeys.has(itemKey)) {
                    continue;
                }

                if (deletion.targets.some(target => pausedZones.has(target.zone) || !zones.has(target.zone) || !canSendTo(target.zone))) {
                    heldKeys.add(itemKey);
                    continue;
                }

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

            for (const [targetScope, payloads] of payloadsByScope) {
                yield* transport.addPendingSaves(targetScope, payloads);
            }

            for (const [targetScope, deleteIds] of deleteIdsByScope) {
                yield* transport.addPendingDeletes(targetScope, deleteIds);
            }

            if (isPrivateReady) {
                yield* pushHeartbeat();
            }

            yield* publish;
        });

        const stopEngineUnlocked = Effect.fnUntraced(function* () {
            yield* transport.stopSync(scope).pipe(Effect.catchTag('CloudSyncTransportError', () => Effect.void));

            if ((yield* Ref.get(session)).isSharedEngineRunning) {
                yield* transport.stopSync(ICloudSyncScope.SHARED).pipe(Effect.catchTag('CloudSyncTransportError', () => Effect.void));
            }

            pushed.clear();
            itemKeyByRecordKey.clear();
            sidePending.clear();
            heldKeys.clear();
            failedKeys.clear();
            quotaKeys.clear();
            yield* patch({
                isEngineRunning: false,
                isSharedEngineRunning: false,
                isAwaitingMeta: false,
                isReconciling: false,
                isSharedReconciling: false,
                isFetching: false
            });
        });

        const isHouseholdLossCode = (code: ICloudErrorCode): boolean =>
            code === ICloudErrorCode.ZONE_NOT_FOUND ||
            code === ICloudErrorCode.USER_DELETED_ZONE ||
            code === ICloudErrorCode.PERMISSION_FAILURE ||
            code === ICloudErrorCode.ENCRYPTED_DATA_RESET;

        const endHouseholdUnlocked = Effect.fnUntraced(function* (mode: HouseholdEndModeEnum) {
            if ((yield* Ref.get(session)).isSharedEngineRunning) {
                yield* transport.stopSync(ICloudSyncScope.SHARED).pipe(Effect.catchTag('CloudSyncTransportError', () => Effect.void));
            }

            for (const [itemKey, item] of [...pushed]) {
                if (item.syncZone === HOUSEHOLD_SYNC_ZONE) {
                    dropItem(itemKey);
                }
            }

            for (const keys of [heldKeys, failedKeys, quotaKeys]) {
                for (const key of [...keys]) {
                    if (key.startsWith(`${HOUSEHOLD_SYNC_ZONE}|`)) {
                        keys.delete(key);
                    }
                }
            }

            yield* mode === HouseholdEndModeEnum.KEEP_PERSONAL_COPY
                ? householdMembershipService.keepPersonalCopy()
                : householdMembershipService.dropHouseholdData();
            yield* stateStore.update({ sharedStateSerialization: null });
            yield* patch({ isSharedEngineRunning: false, isSharedReconciling: false });
            yield* refreshZones();
            yield* bumpHouseholdRefresh;

            if (mode === HouseholdEndModeEnum.KEEP_PERSONAL_COPY) {
                yield* drainUnlocked();
            }
        });

        const isHouseholdShareActive = (zoneName: string) =>
            transport.getShareParticipants(zoneName).pipe(
                Effect.map(isNotEmptyArray),
                Effect.catchTag('CloudSyncTransportError', error =>
                    Effect.succeed(error.code !== ICloudErrorCode.ZONE_NOT_FOUND && error.code !== ICloudErrorCode.USER_DELETED_ZONE)
                )
            );

        const startSharedEngineUnlocked = Effect.fnUntraced(function* (isRestoring: boolean) {
            const household = zones.get(HOUSEHOLD_SYNC_ZONE);

            if (!isDefined(household) || household.databaseScope !== SyncDatabaseScopeEnum.SHARED) {
                return;
            }

            if (isRestoring && !(yield* isHouseholdShareActive(household.zoneName))) {
                yield* endHouseholdUnlocked(HouseholdEndModeEnum.DROP);

                return;
            }

            const sharedStateSerialization = isRestoring ? null : (yield* stateStore.read).sharedStateSerialization;

            yield* stateStore.update({ sharedStateSerialization });
            yield* transport.startSync(ICloudSyncScope.SHARED, sharedStateSerialization);
            yield* patch({ isSharedEngineRunning: true, isSharedReconciling: isRestoring && (yield* Ref.get(session)).isReconciling });
            yield* drainUnlocked();
            yield* Effect.forkDetach(logAndContinue(transport.syncNow(ICloudSyncScope.SHARED)));
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

        const startEngineUnlocked = Effect.fnUntraced(function* (userRecordName: string) {
            const stored = yield* stateStore.read;

            if (isDefined(stored.boundUserRecordName) && stored.boundUserRecordName !== userRecordName) {
                yield* stopEngineUnlocked();
                yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT });

                return;
            }

            if (!isDefined(stored.boundUserRecordName)) {
                yield* stateStore.update({ boundUserRecordName: userRecordName });
            }

            yield* refreshZones();
            yield* applyService.resume();
            yield* transport.ensureZone(scope, CLOUD_SYNC_RECORDS.personalZoneName);

            for (const zone of zones.values()) {
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

            yield* transport.startSync(scope, stateSerialization);
            yield* patch({
                isEngineRunning: true,
                isAwaitingMeta: decision === CloudSyncLineageDecisionEnum.WRITE_META,
                isReconciling,
                blocked: null,
                isInitialFetchComplete: isDefined(stateSerialization)
            });

            if (decision === CloudSyncLineageDecisionEnum.WRITE_META) {
                yield* pushSideRecord(CLOUD_SYNC_RECORDS.metaRecordType, CLOUD_SYNC_RECORDS.metaRecordName, {
                    lineageId: yield* identityRepository.ensureLineageId()
                });
            } else {
                yield* drainUnlocked();
            }

            yield* Effect.forkDetach(logAndContinue(transport.syncNow(scope)));
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

                const account = yield* transport.getAccountStatus();

                if (account.status !== 'available') {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_SIGNED_OUT });

                    return;
                }

                if (!isString(account.userRecordName)) {
                    yield* patch({ blocked: CloudSyncStatusEnum.ERROR });

                    return;
                }

                yield* startEngineUnlocked(account.userRecordName);
            },
            Effect.catchTag('CloudSyncTransportError', error =>
                patch({
                    isEngineRunning: false,
                    blocked:
                        error.code === ICloudErrorCode.ACCOUNT_UNAVAILABLE
                            ? CloudSyncStatusEnum.PAUSED_SIGNED_OUT
                            : CloudSyncStatusEnum.ERROR
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

        const confirm = (event: Pick<ICloudScopedEvent, 'scope'> & { readonly batchId: string }) =>
            transport.confirmFetchedBatch(event.scope, event.batchId);

        const acknowledgeComplete = Effect.fnUntraced(function* (itemKeys: ReadonlySet<string>) {
            const complete = [...itemKeys].flatMap(itemKey => {
                const item = pushed.get(itemKey);
                const isComplete =
                    isDefined(item) &&
                    item.records.every(record => item.savedSystemFields.has(keyOf(record.zone, record.recordName))) &&
                    item.deleteTargets.every(target => item.deletedKeys.has(keyOf(target.zone, target.recordName)));

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
                            systemFields: item.savedSystemFields.get(keyOf(record.zone, record.recordName)) ?? null
                        })),
                        deletedTargets: item.deleteTargets
                    }))
                );
                complete.forEach(item => {
                    dropItem(keyOf(item.syncZone, item.syncId));
                });
            }
        });

        const handleFailedSave = Effect.fnUntraced(function* (failure: ICloudFailedSave) {
            const label = labelOf(failure);

            if (!isDefined(label)) {
                return;
            }

            const recordKey = keyOf(label, failure.recordName);
            const isSideRecord = isSideRecordType(failure.recordType);

            sidePending.delete(recordKey);

            if (label === HOUSEHOLD_SYNC_ZONE && isHouseholdLossCode(failure.code)) {
                yield* endHouseholdUnlocked(householdEndMode());

                return;
            }

            if (failure.code === ICloudErrorCode.ZONE_NOT_FOUND || failure.code === ICloudErrorCode.ENCRYPTED_DATA_RESET) {
                yield* recoverZoneUnlocked();

                return;
            }

            if (failure.code === ICloudErrorCode.SERVER_RECORD_CHANGED && isDefined(failure.serverRecord)) {
                const { serverRecord } = failure;

                if (isSideRecord) {
                    yield* storeSideRecord(toEnvelope(serverRecord, label), serverRecord.systemFields);

                    if ((yield* Ref.get(session)).isAwaitingMeta) {
                        yield* stopEngineUnlocked();
                        yield* reconfigureUnlocked();
                    }

                    return;
                }

                yield* applyService.resolveConflict({ record: toEnvelope(serverRecord, label), systemFields: serverRecord.systemFields });
            }

            const itemKey = itemKeyByRecordKey.get(recordKey);

            if (isDefined(itemKey)) {
                dropItem(itemKey);

                if (failure.code === ICloudErrorCode.QUOTA_EXCEEDED) {
                    failedKeys.add(itemKey);
                    quotaKeys.add(itemKey);
                    yield* patch({ isQuotaExceeded: true });
                } else if (failure.code !== ICloudErrorCode.SERVER_RECORD_CHANGED) {
                    failedKeys.add(itemKey);
                    yield* patch({ blocked: CloudSyncStatusEnum.ERROR });
                }
            }
        });

        const handleSentChanges = Effect.fn('CloudSyncService.handleSentChanges')(
            function* (event: ICloudSentChangesEvent) {
                const touched = new Set<string>();

                for (const saved of event.savedRecords) {
                    const label = labelOf(saved);

                    if (!isDefined(label)) {
                        continue;
                    }

                    const recordKey = keyOf(label, saved.recordName);
                    const sideEnvelope = sidePending.get(recordKey);

                    if (isDefined(sideEnvelope)) {
                        sidePending.delete(recordKey);
                        yield* storeSideRecord(sideEnvelope, saved.systemFields);

                        if (saved.recordType === CLOUD_SYNC_RECORDS.metaRecordType) {
                            yield* stateStore.update({ resolvedLineageId: yield* identityRepository.ensureLineageId() });
                            yield* patch({ isAwaitingMeta: false });
                        }

                        continue;
                    }

                    const itemKey = itemKeyByRecordKey.get(recordKey);

                    if (isDefined(itemKey)) {
                        pushed.get(itemKey)?.savedSystemFields.set(recordKey, saved.systemFields);
                        touched.add(itemKey);
                    }
                }

                const deletedIds = [
                    ...event.deletedRecords,
                    ...event.failedDeletes.filter(failed => failed.code === ICloudErrorCode.UNKNOWN_ITEM)
                ];

                for (const deleted of deletedIds) {
                    const label = labelOf(deleted);
                    const recordKey = isDefined(label) ? keyOf(label, deleted.recordName) : null;
                    const itemKey = isDefined(recordKey) ? itemKeyByRecordKey.get(recordKey) : undefined;

                    if (isDefined(recordKey) && isDefined(itemKey)) {
                        pushed.get(itemKey)?.deletedKeys.add(recordKey);
                        touched.add(itemKey);
                    }
                }

                for (const failure of event.failedSaves) {
                    yield* handleFailedSave(failure);
                }

                yield* acknowledgeComplete(touched);
                yield* confirm(event);

                if (isNotEmptyArray(event.savedRecords) && quotaKeys.size === 0) {
                    yield* patch({ isQuotaExceeded: false });
                }

                if (pushed.size <= uploadLowWaterMark) {
                    yield* drainUnlocked();
                }

                yield* publish;
            },
            effect => locked(effect)
        );

        const automate = (result: SyncApplyResultInterface) => logAndContinue(automationService.afterApply(result));

        const handleFetchedChanges = Effect.fn('CloudSyncService.handleFetchedChanges')(
            function* (event: ICloudFetchedChangesEvent) {
                const records: SyncIncomingRecordInterface[] = [];
                const deletions: SyncIncomingDeletionInterface[] = [];

                for (const record of event.records) {
                    const label = labelOf(record);

                    if (!isDefined(label)) {
                        continue;
                    }

                    if (isSideRecordType(record.recordType)) {
                        yield* storeSideRecord(toEnvelope(record, label), record.systemFields);
                    } else {
                        records.push({ record: toEnvelope(record, label), systemFields: record.systemFields });
                    }
                }

                for (const deletion of event.deletions) {
                    const label = labelOf(deletion);

                    if (isDefined(label) && !isSideRecordType(deletion.recordType)) {
                        deletions.push({ recordType: deletion.recordType, recordName: deletion.recordName, zone: label });
                    }
                }

                const result = yield* applyService.apply({ records, deletions });

                yield* Ref.update(session, current => ({
                    ...current,
                    fetchedRecordCount: current.fetchedRecordCount + event.records.length,
                    blocked: isNotEmptyArray(result.pausedZones)
                        ? CloudSyncStatusEnum.UPDATE_REQUIRED
                        : current.blocked === CloudSyncStatusEnum.UPDATE_REQUIRED
                          ? null
                          : current.blocked
                }));
                yield* confirm(event);
                yield* automate(result);

                if (isNotEmptyArray(event.changedShares)) {
                    yield* bumpHouseholdRefresh;
                }

                if (isNotEmptyArray(result.reenqueued)) {
                    yield* drainUnlocked();
                }

                yield* publish;
            },
            effect => locked(effect)
        );

        const handleStateSerialization = (event: ICloudStateSerializationEvent) =>
            event.scope === ICloudSyncScope.SHARED
                ? stateStore.update({ sharedStateSerialization: event.stateSerialization })
                : stateStore.update({ stateSerialization: event.stateSerialization });

        const handleWillFetch = (event: ICloudScopedEvent) =>
            event.scope === ICloudSyncScope.SHARED ? Effect.void : patch({ isFetching: true });

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

            if (!isInventoryFetched || isNotEmptyArray(yield* applyService.findPausedZones())) {
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

            const household = zones.get(HOUSEHOLD_SYNC_ZONE);

            if (household?.role === SyncZoneRoleEnum.OWNER) {
                if (!(yield* isHouseholdShareActive(household.zoneName))) {
                    yield* transport
                        .deleteZone(scope, household.zoneName)
                        .pipe(Effect.catchTag('CloudSyncTransportError', () => Effect.void));
                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);

                    return;
                }

                yield* reconcileHouseholdZone(scope, household.zoneName);
            }
        });

        const completeSharedReconciliation = Effect.fnUntraced(function* () {
            const household = zones.get(HOUSEHOLD_SYNC_ZONE);

            if (
                household?.databaseScope === SyncDatabaseScopeEnum.SHARED &&
                (yield* reconcileHouseholdZone(ICloudSyncScope.SHARED, household.zoneName))
            ) {
                yield* patch({ isSharedReconciling: false });
            }
        });

        const handleDidFetch = Effect.fn('CloudSyncService.handleDidFetch')(
            function* (event: ICloudScopedEvent) {
                if (event.scope === ICloudSyncScope.SHARED) {
                    if ((yield* Ref.get(session)).isSharedReconciling) {
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

                if ((yield* Ref.get(session)).isReconciling) {
                    yield* completeReconciliation();
                }

                for (const quotaKey of quotaKeys) {
                    failedKeys.delete(quotaKey);
                }

                quotaKeys.clear();
                yield* bankOwnershipService.evaluate();
                yield* drainUnlocked();
            },
            effect => locked(effect)
        );

        const handleAccountChange = Effect.fn('CloudSyncService.handleAccountChange')(
            function* (event: ICloudAccountChangeEvent) {
                if (event.scope === ICloudSyncScope.SHARED) {
                    yield* confirm(event);

                    return;
                }

                yield* Effect.sync(() => {
                    appAtomRegistry.update(iCloudAccountRefreshAtom, count => count + 1);
                });

                const stored = yield* stateStore.read;
                const current = yield* Ref.get(session);

                if (event.changeType === ICloudAccountChangeType.SIGN_OUT) {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_SIGNED_OUT });
                } else if (isDefined(stored.boundUserRecordName) && event.currentUserRecordName !== stored.boundUserRecordName) {
                    yield* stopEngineUnlocked();
                    yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT });
                } else if (!(current.isEngineRunning && event.changeType === ICloudAccountChangeType.SIGN_IN)) {
                    yield* stopEngineUnlocked();
                    yield* stateStore.update({ stateSerialization: null });
                    yield* patch({ blocked: null });
                    yield* reconfigureUnlocked();
                }

                yield* confirm(event);
            },
            effect => locked(effect)
        );

        const handleZoneChange = Effect.fn('CloudSyncService.handleZoneChange')(
            function* (event: ICloudZoneChangeEvent) {
                const personalDeletions = event.deleted.filter(zone => labelOf(zone) === PERSONAL_SYNC_ZONE);
                const householdDeletions = event.deleted.filter(zone => labelOf(zone) === HOUSEHOLD_SYNC_ZONE);

                if (personalDeletions.some(zone => zone.reason === ICloudZoneChangeReason.ENCRYPTED_DATA_RESET)) {
                    yield* recoverZoneUnlocked();
                } else if (isNotEmptyArray(personalDeletions)) {
                    yield* stopEngineUnlocked();
                    yield* settingsRepository.update({ cloudSyncEnabled: false });
                }

                if (isNotEmptyArray(householdDeletions)) {
                    yield* endHouseholdUnlocked(householdEndMode());
                }

                yield* confirm(event);
            },
            effect => locked(effect)
        );

        const foreground = Effect.fn('CloudSyncService.foreground')(
            function* () {
                const current = yield* Ref.get(session);

                if (current.isEngineRunning) {
                    failedKeys.clear();
                    quotaKeys.clear();
                    yield* drainUnlocked();
                    yield* Effect.forkDetach(logAndContinue(transport.syncNow(scope)));

                    if (current.isSharedEngineRunning) {
                        yield* Effect.forkDetach(logAndContinue(transport.syncNow(ICloudSyncScope.SHARED)));
                    }
                } else {
                    yield* reconfigureUnlocked();
                }
            },
            effect => locked(effect)
        );

        const useCloudData = Effect.fnUntraced(function* () {
            yield* safetyCopyService.create();
            yield* stopEngineUnlocked();

            const zoneLineageId = yield* readZoneLineage();

            if (Option.isNone(zoneLineageId)) {
                return;
            }

            yield* resetRepository.clearSyncedData();
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
            yield* safetyCopyService.create();
            yield* stopEngineUnlocked();
            yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.personalZoneName);
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: null, restorePhase: CloudSyncRestorePhaseEnum.NONE });
            yield* resetRepository.clearSyncState();
            yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            yield* patch({ blocked: null, fetchedRecordCount: 0, isInitialFetchComplete: false });
            yield* reconfigureUnlocked();
        });

        const handleShareAccepted = Effect.fn('CloudSyncService.handleShareAccepted')(
            function* (event: ICloudShareAcceptedEvent) {
                if (event.outcome !== ICloudShareOutcome.ACCEPTED) {
                    yield* Effect.sync(() => {
                        showErrorToast(
                            t`Could not join the family`,
                            t`The invitation could not be accepted. Open the invitation link again to retry.`
                        );
                    });
                    yield* bumpHouseholdRefresh;

                    return;
                }

                const existing = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);

                if (isDefined(existing) && (existing.role === SyncZoneRoleEnum.OWNER || existing.ownerName !== event.ownerName)) {
                    return;
                }

                yield* zoneRegistryRepository.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: event.zoneName,
                    ownerName: event.ownerName,
                    databaseScope: SyncDatabaseScopeEnum.SHARED,
                    role: SyncZoneRoleEnum.PARTICIPANT
                });
                yield* refreshZones();

                if ((yield* Ref.get(session)).isEngineRunning) {
                    yield* startSharedEngineUnlocked(false);
                }

                yield* bumpHouseholdRefresh;
            },
            effect => locked(effect)
        );

        const handleShareChanged = Effect.fn('CloudSyncService.handleShareChanged')(
            function* (event: ICloudShareChangedEvent) {
                if (event.change === ICloudShareChange.STOPPED && zones.get(HOUSEHOLD_SYNC_ZONE)?.role === SyncZoneRoleEnum.OWNER) {
                    yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                    yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
                } else {
                    yield* bumpHouseholdRefresh;
                }
            },
            effect => locked(effect)
        );

        const dispatchEvent = (item: CloudSyncEventType) => {
            switch (item.kind) {
                case CloudSyncEventKindEnum.STATE_SERIALIZATION:
                    return handleStateSerialization(item.event);
                case CloudSyncEventKindEnum.FETCHED_CHANGES:
                    return handleFetchedChanges(item.event);
                case CloudSyncEventKindEnum.SENT_CHANGES:
                    return handleSentChanges(item.event);
                case CloudSyncEventKindEnum.ACCOUNT_CHANGE:
                    return handleAccountChange(item.event);
                case CloudSyncEventKindEnum.ZONE_CHANGE:
                    return handleZoneChange(item.event);
                case CloudSyncEventKindEnum.WILL_FETCH:
                    return handleWillFetch(item.event);
                case CloudSyncEventKindEnum.DID_FETCH:
                    return handleDidFetch(item.event);
                case CloudSyncEventKindEnum.SHARE_ACCEPTED:
                    return handleShareAccepted(item.event);
                case CloudSyncEventKindEnum.SHARE_CHANGED:
                    return handleShareChanged(item.event);
            }
        };
        const reconfigure = () => locked(reconfigureUnlocked());
        const deleteHouseholdZone = transport.stopSharing(CLOUD_SYNC_RECORDS.householdZoneName).pipe(
            Effect.catchTag('CloudSyncTransportError', () => Effect.void),
            Effect.andThen(transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName)),
            Effect.as(true),
            Effect.catchTag('CloudSyncTransportError', error => Effect.succeed(error.code === ICloudErrorCode.ZONE_NOT_FOUND))
        );
        const finishHouseholdCleanupUnlocked = Effect.fnUntraced(
            function* () {
                if (!(yield* stateStore.read).isHouseholdCleanupPending) {
                    return;
                }

                if ((yield* transport.getAccountStatus()).status !== 'available') {
                    return;
                }

                if (yield* deleteHouseholdZone) {
                    yield* stateStore.update({ isHouseholdCleanupPending: false });
                }
            },
            Effect.catchTag('CloudSyncTransportError', () => Effect.void)
        );
        const drain = () => locked(drainUnlocked());

        const forkConsumer = <A, E, R, R2>(stream: Stream.Stream<A, E, R>, handle: (event: A) => Effect.Effect<unknown, unknown, R2>) =>
            Effect.forkDetach(Stream.runForEach(stream, event => logAndContinue(handle(event))));

        return {
            handleFetchedChanges,
            handleSentChanges,
            handleStateSerialization,
            handleWillFetch,
            handleDidFetch,
            handleAccountChange,
            handleZoneChange,
            handleShareAccepted,
            handleShareChanged,
            reconfigure,
            drain,
            prepareHouseholdOwnerZone: Effect.fn('CloudSyncService.prepareHouseholdOwnerZone')(function* () {
                const existing = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);

                if (existing?.role === SyncZoneRoleEnum.PARTICIPANT) {
                    return;
                }

                yield* finishHouseholdCleanupUnlocked();
                yield* transport.ensureZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                yield* zoneRegistryRepository.upsert({
                    zoneLabel: HOUSEHOLD_SYNC_ZONE,
                    zoneName: CLOUD_SYNC_RECORDS.householdZoneName,
                    ownerName: ICLOUD_DEFAULT_OWNER_NAME,
                    databaseScope: SyncDatabaseScopeEnum.PRIVATE,
                    role: SyncZoneRoleEnum.OWNER
                });
                yield* refreshZones();
            }, locked),
            stopHouseholdSharing: Effect.fn('CloudSyncService.stopHouseholdSharing')(function* () {
                yield* transport.stopSharing(CLOUD_SYNC_RECORDS.householdZoneName);
                yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.householdZoneName);
                yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
            }, locked),
            removeEmptyHousehold: Effect.fn('CloudSyncService.removeEmptyHousehold')(function* () {
                if (!(yield* deleteHouseholdZone)) {
                    yield* stateStore.update({ isHouseholdCleanupPending: true });
                }

                yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
            }, locked),
            leaveHousehold: Effect.fn('CloudSyncService.leaveHousehold')(function* () {
                yield* transport.leaveShare(CLOUD_SYNC_RECORDS.householdZoneName);
                yield* endHouseholdUnlocked(HouseholdEndModeEnum.KEEP_PERSONAL_COPY);
            }, locked),
            resolveLineageConflict: Effect.fn('CloudSyncService.resolveLineageConflict')(function* (choice: CloudSyncLineageChoiceEnum) {
                yield* choice === CloudSyncLineageChoiceEnum.USE_ICLOUD_DATA ? useCloudData() : keepThisDevice();
            }, locked),
            start: Effect.fn('CloudSyncService.start')(function* () {
                yield* forkConsumer(transport.events, dispatchEvent);
                yield* forkConsumer(
                    Stream.filter(appStateChanges, state => state === 'active'),
                    () => foreground()
                );
                yield* forkConsumer(
                    databaseChangeService.changes.pipe(
                        Stream.filter(tableNames => tableNames.some(tableName => userDataTableNames.has(tableName))),
                        Stream.debounce(localWriteDebounce)
                    ),
                    drain
                );
                yield* forkConsumer(
                    databaseChangeService.changes.pipe(
                        Stream.filter(tableNames => tableNames.includes('settings')),
                        Stream.debounce(settingsDebounce)
                    ),
                    reconfigure
                );
                yield* locked(finishHouseholdCleanupUnlocked());
                yield* reconfigure();
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CloudSyncService, CloudSyncService.make).pipe(
        Layer.provide([
            CloudSyncTransport.layer,
            CloudSyncStateStore.layer,
            InstallIdService.layer,
            SettingsRepository.layer,
            SyncUploadService.layer,
            SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)),
            SyncOutboxRepository.layer,
            SyncRecordRepository.layer,
            SyncZoneRegistryRepository.layer,
            SyncIdentityRepository.layer,
            SyncResetRepository.layer,
            BankOwnershipService.layer,
            DatabaseChangeService.layer,
            CloudSyncSafetyCopyService.layer,
            SyncRestoreReconciliationService.layer.pipe(
                Layer.provide(SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)))
            ),
            HouseholdMembershipService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer)),
            HouseholdShareService.layer,
            SyncAutomationService.layer.pipe(Layer.provide(syncAutomationEmbeddingBoostLayer))
        ])
    );
}
