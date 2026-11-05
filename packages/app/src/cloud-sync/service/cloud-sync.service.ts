import {
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
    SyncUploadService,
    SyncZoneRoleEnum,
    SyncZoneRegistryRepository,
    listClearedSyncFields
} from '@budgie/contracts';
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
    ICloudSyncScope,
    ICloudZoneChangeReason
} from '../../../modules/icloud';
import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { DatabaseChangeService } from '../../@generic/drizzle/service/database-change.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { InstallIdService } from '../../cloud-backup/service/install-id.service';
import { CloudSyncDeviceRecordSchema } from '../constant/cloud-sync-device-record-schema.constant';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';
import { appStateChanges } from '../constant/app-state-changes.constant';
import { syncAccountBalanceRefresherLayer } from '../layer/sync-account-balance-refresher.layer';
import { CloudSyncEventKindEnum } from '../enum/cloud-sync-event-kind.enum';
import { CloudSyncLineageChoiceEnum } from '../enum/cloud-sync-lineage-choice.enum';
import { CloudSyncLineageDecisionEnum } from '../enum/cloud-sync-lineage-decision.enum';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

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
    ICloudStateSerializationEvent,
    ICloudZoneChangeEvent
} from '../../../modules/icloud';
import type { CloudSyncEventType } from '../type/cloud-sync-event.type';
import type { CloudSyncEnvelopeInterface } from '../interface/cloud-sync-envelope.interface';
import type { CloudSyncPushedItemInterface } from '../interface/cloud-sync-pushed-item.interface';
import type { CloudSyncSessionInterface } from '../interface/cloud-sync-session.interface';
import type { SyncIncomingDeletionInterface, SyncIncomingRecordInterface } from '@budgie/contracts';

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
        const lock = yield* Semaphore.make(1);
        const locked = lock.withPermits(1);
        const session = yield* Ref.make<CloudSyncSessionInterface>({
            isEngineRunning: false,
            isAwaitingMeta: false,
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
        const zones = new Map<string, { readonly zoneName: string; readonly ownerName: string }>();
        const labelByZone = new Map<string, string>();
        const pushed = new Map<string, CloudSyncPushedItemInterface>();
        const itemKeyByRecordKey = new Map<string, string>();
        const sidePending = new Map<string, CloudSyncEnvelopeInterface>();
        const heldKeys = new Set<string>();
        const failedKeys = new Set<string>();

        const keyOf = (zone: string, name: string): string => `${zone}|${name}`;

        const publish = Effect.flatMap(Ref.get(session), current =>
            Effect.sync(() => {
                appAtomRegistry.set(cloudSyncStatusAtom, {
                    status: current.blocked ?? (current.isFetching || pushed.size > 0 ? CloudSyncStatusEnum.SYNCING : CloudSyncStatusEnum.IDLE),
                    lastSyncedAt: current.lastSyncedAt,
                    fetchedRecordCount: current.fetchedRecordCount,
                    isInitialFetchComplete: current.isInitialFetchComplete
                });
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
                if (zone.databaseScope === SyncDatabaseScopeEnum.PRIVATE) {
                    zones.set(zone.zoneLabel, zone);
                    labelByZone.set(keyOf(zone.ownerName, zone.zoneName), zone.zoneLabel);
                }
            }
        });

        const labelOf = (id: Pick<ICloudRecordId, 'ownerName' | 'zoneName'>): string | undefined =>
            labelByZone.get(keyOf(id.ownerName, id.zoneName));

        const toEnvelope = (record: Pick<ICloudFetchedRecord, 'encryptedFields' | 'recordName' | 'recordType' | 'schemaVersion'>, zone: string) => ({
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

        const pushSideRecord = Effect.fnUntraced(function* (recordType: string, recordName: string, encryptedFields: Readonly<Record<string, string | number>>) {
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

            if (!current.isEngineRunning || current.isAwaitingMeta) {
                return;
            }

            const pausedZones = new Set((yield* applyService.findPausedZones()).map(({ syncZone }) => syncZone));
            const batch = yield* uploadService.pending(pushed.size + heldKeys.size + failedKeys.size + uploadBatchSize);
            const payloads: ICloudRecordPayload[] = [];
            const deleteIds: ICloudRecordId[] = [];

            heldKeys.clear();
            batch.rejections.forEach(rejection => heldKeys.add(keyOf(rejection.syncZone, rejection.syncId)));

            const register = (item: CloudSyncPushedItemInterface): void => {
                const itemKey = keyOf(item.syncZone, item.syncId);

                pushed.set(itemKey, item);
                item.records.forEach(record => itemKeyByRecordKey.set(keyOf(record.zone, record.recordName), itemKey));
                item.deleteTargets.forEach(target => itemKeyByRecordKey.set(keyOf(target.zone, target.recordName), itemKey));
            };

            const toDeleteIds = (targets: readonly { readonly recordName: string; readonly zone: string }[]): ICloudRecordId[] =>
                targets.flatMap(target => {
                    const zone = zones.get(target.zone);

                    return isDefined(zone) ? [{ zoneName: zone.zoneName, ownerName: zone.ownerName, recordName: target.recordName }] : [];
                });

            for (const save of batch.saves) {
                const itemKey = keyOf(save.syncZone, save.syncId);
                const isBlocked = save.records.some(record => pausedZones.has(record.zone) || !zones.has(record.zone));

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
                        payloads.push(payload);
                    }
                }

                deleteIds.push(...toDeleteIds(save.staleTargets));
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

                if (deletion.targets.some(target => pausedZones.has(target.zone) || !zones.has(target.zone))) {
                    heldKeys.add(itemKey);
                    continue;
                }

                deleteIds.push(...toDeleteIds(deletion.targets));
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

            if (isNotEmptyArray(payloads)) {
                yield* transport.addPendingSaves(scope, payloads);
            }

            if (isNotEmptyArray(deleteIds)) {
                yield* transport.addPendingDeletes(scope, deleteIds);
            }

            yield* pushHeartbeat();
            yield* publish;
        });

        const stopEngineUnlocked = Effect.fnUntraced(function* () {
            yield* transport.stopSync(scope).pipe(Effect.catchTag('CloudSyncTransportError', () => Effect.void));
            pushed.clear();
            itemKeyByRecordKey.clear();
            sidePending.clear();
            heldKeys.clear();
            failedKeys.clear();
            yield* patch({ isEngineRunning: false, isAwaitingMeta: false, isFetching: false });
        });

        const readZoneLineage = Effect.fnUntraced(function* () {
            const meta = yield* transport.fetchRecord(CLOUD_SYNC_RECORDS.personalZoneName, CLOUD_SYNC_RECORDS.metaRecordName);

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

            const decision = yield* decideLineage();

            if (decision === CloudSyncLineageDecisionEnum.CONFLICT) {
                yield* stopEngineUnlocked();
                yield* patch({ blocked: CloudSyncStatusEnum.LINEAGE_CONFLICT });

                return;
            }

            if (decision === CloudSyncLineageDecisionEnum.WRITE_META) {
                yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            }

            yield* transport.startSync(scope, stored.stateSerialization);
            yield* patch({
                isEngineRunning: true,
                isAwaitingMeta: decision === CloudSyncLineageDecisionEnum.WRITE_META,
                blocked: null,
                isInitialFetchComplete: isDefined(stored.stateSerialization)
            });

            if (decision === CloudSyncLineageDecisionEnum.WRITE_META) {
                yield* pushSideRecord(CLOUD_SYNC_RECORDS.metaRecordType, CLOUD_SYNC_RECORDS.metaRecordName, {
                    lineageId: yield* identityRepository.ensureLineageId()
                });
            } else {
                yield* drainUnlocked();
            }

            yield* Effect.forkDetach(logAndContinue(transport.syncNow(scope)));
        });

        const reconfigureUnlocked = Effect.fnUntraced(function* () {
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

            if (account.status === 'noAccount' || account.status === 'restricted') {
                yield* stopEngineUnlocked();
                yield* patch({ blocked: CloudSyncStatusEnum.PAUSED_SIGNED_OUT });

                return;
            }

            if (account.status !== 'available' || !isString(account.userRecordName)) {
                yield* patch({ blocked: CloudSyncStatusEnum.ERROR });

                return;
            }

            yield* startEngineUnlocked(account.userRecordName);
        }, Effect.catchTag('CloudSyncTransportError', error =>
            patch({
                isEngineRunning: false,
                blocked: error.code === ICloudErrorCode.ACCOUNT_UNAVAILABLE ? CloudSyncStatusEnum.PAUSED_SIGNED_OUT : CloudSyncStatusEnum.ERROR
            })
        ));

        const recoverZoneUnlocked = Effect.fnUntraced(function* () {
            yield* stopEngineUnlocked();
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: null });
            yield* resetRepository.clearSyncState();
            yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            yield* reconfigureUnlocked();
        });

        const confirm = (event: { readonly batchId: string }) => transport.confirmFetchedBatch(scope, event.batchId);

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

                if (failure.code !== ICloudErrorCode.SERVER_RECORD_CHANGED) {
                    failedKeys.add(itemKey);
                    yield* patch({ blocked: CloudSyncStatusEnum.ERROR });
                }
            }
        });

        const handleSentChanges = Effect.fn('CloudSyncService.handleSentChanges')(function* (event: ICloudSentChangesEvent) {
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

            const deletedIds = [...event.deletedRecords, ...event.failedDeletes.filter(failed => failed.code === ICloudErrorCode.UNKNOWN_ITEM)];

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

            if (pushed.size <= uploadLowWaterMark) {
                yield* drainUnlocked();
            }

            yield* publish;
        }, effect => locked(effect));

        const handleFetchedChanges = Effect.fn('CloudSyncService.handleFetchedChanges')(function* (event: ICloudFetchedChangesEvent) {
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

            if (isNotEmptyArray(result.reenqueued)) {
                yield* drainUnlocked();
            }

            yield* publish;
        }, effect => locked(effect));

        const handleStateSerialization = (event: ICloudStateSerializationEvent) =>
            stateStore.update({ stateSerialization: event.stateSerialization });

        const handleWillFetch = (_event: ICloudScopedEvent) => patch({ isFetching: true });

        const handleDidFetch = Effect.fn('CloudSyncService.handleDidFetch')(function* (_event: ICloudScopedEvent) {
            yield* patch({
                isFetching: false,
                isInitialFetchComplete: true,
                lastSyncedAt: yield* Clock.currentTimeMillis
            });
            yield* bankOwnershipService.evaluate();
            yield* drainUnlocked();
        }, effect => locked(effect));

        const handleAccountChange = Effect.fn('CloudSyncService.handleAccountChange')(function* (event: ICloudAccountChangeEvent) {
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
        }, effect => locked(effect));

        const handleZoneChange = Effect.fn('CloudSyncService.handleZoneChange')(function* (event: ICloudZoneChangeEvent) {
            const ownDeletions = event.deleted.filter(zone => isDefined(labelOf(zone)));

            if (ownDeletions.some(zone => zone.reason === ICloudZoneChangeReason.ENCRYPTED_DATA_RESET)) {
                yield* recoverZoneUnlocked();
            } else if (isNotEmptyArray(ownDeletions)) {
                yield* stopEngineUnlocked();
                yield* settingsRepository.update({ cloudSyncEnabled: false });
            }

            yield* confirm(event);
        }, effect => locked(effect));

        const foreground = Effect.fn('CloudSyncService.foreground')(function* () {
            const current = yield* Ref.get(session);

            if (current.isEngineRunning) {
                failedKeys.clear();
                yield* drainUnlocked();
                yield* Effect.forkDetach(logAndContinue(transport.syncNow(scope)));
            } else {
                yield* reconfigureUnlocked();
            }
        }, effect => locked(effect));

        const useCloudData = Effect.fnUntraced(function* () {
            yield* safetyCopyService.create();
            yield* stopEngineUnlocked();

            const zoneLineageId = yield* readZoneLineage();

            if (Option.isNone(zoneLineageId)) {
                return;
            }

            yield* resetRepository.clearSyncedData();
            yield* identityRepository.adoptLineageId(zoneLineageId.value);
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: zoneLineageId.value });
            yield* patch({ blocked: null, fetchedRecordCount: 0, isInitialFetchComplete: false });
            yield* reconfigureUnlocked();
        });

        const keepThisDevice = Effect.fnUntraced(function* () {
            yield* safetyCopyService.create();
            yield* stopEngineUnlocked();
            yield* transport.deleteZone(scope, CLOUD_SYNC_RECORDS.personalZoneName);
            yield* stateStore.update({ stateSerialization: null, resolvedLineageId: null });
            yield* resetRepository.clearSyncState();
            yield* outboxRepository.enqueueAll(PERSONAL_SYNC_ZONE);
            yield* patch({ blocked: null, fetchedRecordCount: 0, isInitialFetchComplete: false });
            yield* reconfigureUnlocked();
        });

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
            }
        };
        const reconfigure = () => locked(reconfigureUnlocked());
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
            reconfigure,
            drain,
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
            CloudSyncSafetyCopyService.layer
        ])
    );
}
