import {
    Db,
    SyncOutboxOperationEnum,
    SyncRecordTypeEnum,
    SyncApplyStateRepository,
    SyncPendingRepository,
    SyncRecordRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isRecord, isString } from '@rnw-community/shared';

import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SYNC_RECORD_SCHEMA_VERSION } from '../../mapping/constant/sync-record-schema-version.constant';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { joinSplitTransactions } from '../../mapping/utils/join-split-transactions.util';
import { SyncOutboxRepository } from '../../outbox/repository/sync-outbox.repository';
import { SYNC_JSON_UNKNOWN_SCHEMA } from '../constant/sync-json-unknown-schema.constant';
import { SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE } from '../constant/sync-schema-paused.constant';
import { SyncApplyRepository } from '../repository/sync-apply.repository';
import { readStoredMovedTo } from '../utils/read-stored-moved-to.util';
import { stringifySyncJson } from '../utils/stringify-sync-json.util';
import { SyncApplyTracker } from '../utils/sync-apply-tracker.util';
import { toStoredSyncApplyItem } from '../utils/to-stored-sync-apply-item.util';
import { toSyncApplyItem } from '../utils/to-sync-apply-item.util';

import { SyncAccountBalanceRefresher } from './sync-account-balance-refresher.service';
import { SyncApplyUnitService } from './sync-apply-unit.service';
import { SyncDerivedMatcherService } from './sync-derived-matcher.service';

import type { SyncRecordDefinitionInterface } from '../../mapping/interface/sync-record-definition.interface';
import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncApplyBatchInterface } from '../interface/sync-apply-batch.interface';
import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';
import type { SyncApplyUnitInterface } from '../interface/sync-apply-unit.interface';
import type { SyncHeldItemInterface } from '../interface/sync-held-item.interface';
import type { SyncIncomingDeletionInterface } from '../interface/sync-incoming-deletion.interface';
import type { SyncIncomingRecordInterface } from '../interface/sync-incoming-record.interface';

export class SyncApplyService extends Context.Service<SyncApplyService>()('@budgie/cloud-sync/SyncApplyService', {
    make: Effect.gen(function* () {
        const repository = yield* SyncApplyRepository;
        const applyStateRepository = yield* SyncApplyStateRepository;
        const outboxRepository = yield* SyncOutboxRepository;
        const recordRepository = yield* SyncRecordRepository;
        const pendingRepository = yield* SyncPendingRepository;
        const balanceRefresher = yield* SyncAccountBalanceRefresher;
        const derivedMatcher = yield* SyncDerivedMatcherService;
        const unitService = yield* SyncApplyUnitService;

        const definitionsByRecordType = new Map<string, SyncRecordDefinitionInterface>(
            Object.values(SYNC_RECORD_DEFINITIONS).map(definition => [definition.recordType, definition] as const)
        );
        const systemFieldsSchema = Schema.Struct({ modifiedAt: Schema.optionalKey(Schema.Finite) }).pipe(Schema.fromJsonString);

        const itemKey = (item: SyncApplyItemInterface): string => `${item.decoded.zone}|${item.decoded.recordName}`;
        const readModifiedAt = (systemFields: string | null): number | null =>
            isString(systemFields)
                ? Option.match(Schema.decodeOption(systemFieldsSchema)(systemFields), {
                      onNone: () => null,
                      onSome: ({ modifiedAt }) => modifiedAt ?? null
                  })
                : null;
        const readZone = (raw: unknown): string => (isRecord(raw) && isString(raw['zone']) ? raw['zone'] : '');
        const linkMissing = (item: SyncApplyItemInterface): SyncRowReferenceInterface => ({
            column: '',
            tableName: 'transactions',
            kind: SyncReferenceKindEnum.SYNC_ID,
            key: item.decoded.linkId ?? item.decoded.recordName
        });

        const holdPaused = (
            payload: string,
            systemFields: string | null,
            record: Pick<SyncIncomingDeletionInterface, 'recordName' | 'recordType' | 'zone'>
        ) =>
            pendingRepository.add({
                syncZone: record.zone,
                syncId: record.recordName,
                recordType: record.recordType,
                missingRecordType: SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE,
                missingSyncId: record.zone,
                systemFields,
                payload
            });

        const inSavepoint = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
            repository.savepoint.pipe(
                Effect.andThen(Effect.result(effect)),
                Effect.tap(result => (Result.isSuccess(result) ? repository.releaseSavepoint : repository.rollbackSavepoint))
            );

        const loadFamilyItems = Effect.fnUntraced(function* (linkId: string, incoming: readonly SyncApplyItemInterface[]) {
            const incomingKeys = new Set(incoming.map(itemKey));
            const familyRecords = yield* repository.findFamilyRecords(linkId);
            const latestByKey = new Map<string, (typeof familyRecords)[number]>();

            for (const record of familyRecords) {
                const key = `${record.syncZone}|${record.syncId}`;
                const existing = latestByKey.get(key);

                if (!incomingKeys.has(key) && isString(record.payload) && (!isDefined(existing) || record.isPending === 1)) {
                    latestByKey.set(key, record);
                }
            }

            const counterparts: SyncApplyItemInterface[] = [];

            for (const record of latestByKey.values()) {
                if (isString(record.payload)) {
                    const counterpart = yield* Effect.result(toStoredSyncApplyItem(record.payload, record.systemFields));

                    if (Result.isSuccess(counterpart)) {
                        counterparts.push(counterpart.success);
                    }
                }
            }

            return [...incoming, ...counterparts];
        });

        const buildUnits = Effect.fnUntraced(function* (items: readonly SyncApplyItemInterface[]) {
            const isSplit = (item: SyncApplyItemInterface): boolean =>
                item.decoded.recordType === SyncRecordTypeEnum.TRANSACTION_LEG || isDefined(item.decoded.linkId);
            const units: SyncApplyUnitInterface[] = items
                .filter(item => !isSplit(item))
                .map(item => ({
                    incoming: [item],
                    sources: [item],
                    decoded: item.decoded,
                    movedTo: item.movedTo,
                    movedFrom: item.movedFrom
                }));
            const incomplete: SyncApplyItemInterface[] = [];
            const linkIds = new Set(
                items
                    .filter(isSplit)
                    .map(({ decoded }) => decoded.linkId)
                    .filter(isDefined)
            );

            for (const linkId of linkIds) {
                const incoming = items.filter(({ decoded }) => decoded.linkId === linkId);
                const family = yield* loadFamilyItems(linkId, incoming);
                const [home] = joinSplitTransactions(family.map(({ decoded }) => decoded)).joined;

                if (isDefined(home)) {
                    units.push({ incoming, sources: family, decoded: home, movedTo: null, movedFrom: null });
                } else if (family.some(({ decoded }) => decoded.recordType === SyncRecordTypeEnum.TRANSACTION)) {
                    incomplete.push(...incoming);
                } else {
                    for (const item of incoming) {
                        units.push({
                            incoming: [item],
                            sources: [item],
                            decoded: { ...item.decoded, recordType: SyncRecordTypeEnum.TRANSACTION, linkId: null, legCount: 0 },
                            movedTo: null,
                            movedFrom: null
                        });
                    }
                }
            }

            return { units, incomplete };
        });

        const persistApplied = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            for (const source of unit.sources) {
                yield* recordRepository.upsert({
                    syncZone: source.decoded.zone,
                    syncId: source.decoded.recordName,
                    recordType: source.decoded.recordType,
                    systemFields: source.systemFields,
                    payload: source.envelopeJson,
                    schemaVersion: SYNC_RECORD_SCHEMA_VERSION
                });
                yield* pendingRepository.remove(source.decoded.zone, source.decoded.recordName);
            }
        });

        const loadWaiting = Effect.fnUntraced(function* (arrivals: ReadonlySet<string>, known: ReadonlySet<string>) {
            const rows = yield* repository.findPendingWaitingFor([...arrivals]);
            const items: SyncApplyItemInterface[] = [];

            for (const row of rows) {
                if (!known.has(`${row.syncZone}|${row.syncId}`)) {
                    const item = yield* Effect.result(toStoredSyncApplyItem(row.payload, row.systemFields));

                    if (Result.isSuccess(item)) {
                        items.push(item.success);
                    }
                }
            }

            return items;
        });

        const processItems = Effect.fnUntraced(function* (fresh: readonly SyncApplyItemInterface[], tracker: SyncApplyTracker) {
            const held = new Map<string, SyncHeldItemInterface>();
            let queue: readonly SyncApplyItemInterface[] = fresh;

            while (isNotEmptyArray(queue)) {
                const { units, incomplete } = yield* buildUnits(queue);
                const arrivals = new Set<string>();
                let isProgressed = false;

                for (const item of incomplete) {
                    held.set(itemKey(item), { item, missing: linkMissing(item) });
                }

                for (const rawUnit of units) {
                    const unit = yield* unitService.redirectMovedUnit(rawUnit);
                    const attempt = yield* inSavepoint(unitService.applyUnit(unit));

                    if (Result.isFailure(attempt)) {
                        unit.incoming.forEach(item => held.delete(itemKey(item)));
                        tracker.reject({
                            recordType: unit.decoded.recordType,
                            recordName: unit.decoded.recordName,
                            reason: getErrorMessage(attempt.failure)
                        });
                    } else if (isDefined(attempt.success.missing)) {
                        const { missing } = attempt.success;

                        unit.incoming.forEach(item => held.set(itemKey(item), { item, missing }));
                    } else {
                        const outcome = attempt.success;

                        yield* persistApplied(unit);
                        unit.sources.forEach(source => held.delete(itemKey(source)));
                        isProgressed = true;
                        unit.decoded.rows.forEach(row => arrivals.add(row.syncId));
                        arrivals.add(unit.decoded.recordName);

                        if (isDefined(unit.decoded.linkId)) {
                            arrivals.add(unit.decoded.linkId);
                        }

                        if (outcome.isWritten) {
                            tracker.addTouched(unit.decoded.recordType, unit.decoded.recordName, outcome.touchedRows);
                            tracker.addAccountIds(outcome.accountIds);
                        }

                        if (isDefined(outcome.keptColumns)) {
                            tracker.decideOutbox({
                                recordType: unit.decoded.recordType,
                                syncZone: unit.decoded.zone,
                                syncId: unit.decoded.recordName,
                                changedColumns: outcome.keptColumns
                            });
                        }
                    }
                }

                const waiting = isProgressed ? yield* loadWaiting(arrivals, new Set(held.keys())) : [];

                queue = isProgressed ? [...[...held.values()].map(({ item }) => item), ...waiting] : [];
            }

            for (const { item, missing } of held.values()) {
                yield* pendingRepository.add({
                    syncZone: item.decoded.zone,
                    syncId: item.decoded.recordName,
                    recordType: item.decoded.recordType,
                    missingRecordType: missing.tableName,
                    missingSyncId: missing.key,
                    systemFields: item.systemFields,
                    payload: item.envelopeJson
                });
            }
        });

        const intake = Effect.fnUntraced(function* (
            incoming: SyncIncomingRecordInterface,
            pausedZones: Set<string>,
            tracker: SyncApplyTracker
        ) {
            const decodedResult = yield* Effect.result(toSyncApplyItem(incoming.record, incoming.systemFields));

            if (Result.isFailure(decodedResult)) {
                const error = decodedResult.failure;

                if (Predicate.isTagged(error, 'SyncSchemaVersionUnsupportedError')) {
                    const zone = readZone(incoming.record);

                    pausedZones.add(zone);
                    const payload = yield* stringifySyncJson(incoming.record);

                    yield* holdPaused(payload, incoming.systemFields, { recordType: error.recordType, recordName: error.recordName, zone });
                } else {
                    tracker.reject({ recordType: error.recordType, recordName: error.recordName, reason: error.message });
                }

                return null;
            }

            const item = decodedResult.success;
            const { zone, recordName } = item.decoded;

            if (pausedZones.has(zone)) {
                yield* holdPaused(item.envelopeJson, item.systemFields, item.decoded);

                return null;
            }

            const pending = yield* repository.findPending(zone, recordName);
            const stored = yield* recordRepository.find(zone, recordName);
            const isStoredTombstone = isDefined(stored) && isNotEmptyString(readStoredMovedTo(stored.payload));
            const latest = pending ?? (isStoredTombstone ? null : stored);

            if (isDefined(latest)) {
                const incomingAt = readModifiedAt(item.systemFields);
                const latestAt = readModifiedAt(latest.systemFields ?? null);
                const isOlder = isDefined(incomingAt) && isDefined(latestAt) && incomingAt <= latestAt;

                if (latest.payload === item.envelopeJson || isOlder) {
                    const isSystemFieldsRefresh =
                        !isOlder && isDefined(stored) && !isDefined(pending) && stored.systemFields !== item.systemFields;

                    if (isSystemFieldsRefresh) {
                        yield* recordRepository.upsert({ ...stored, systemFields: item.systemFields });
                    }

                    tracker.skip();

                    return null;
                }
            }

            return item;
        });

        const applyDeletion = Effect.fnUntraced(function* (
            deletion: SyncIncomingDeletionInterface,
            pausedZones: ReadonlySet<string>,
            tracker: SyncApplyTracker
        ) {
            const { zone, recordName, recordType } = deletion;

            if (pausedZones.has(zone)) {
                const payload = yield* stringifySyncJson({ deletion: true, recordType, recordName, zone });

                yield* holdPaused(payload, null, deletion);
                tracker.skip();

                return;
            }

            const definition = definitionsByRecordType.get(recordType);

            if (isDefined(definition)) {
                const tableName =
                    definition.recordType === SyncRecordTypeEnum.TRANSACTION_LEG ? 'transactions' : definition.parent.tableName;
                const row = yield* repository.findRow(tableName, zone, recordName);

                if (isDefined(row)) {
                    if (tableName === 'transactions') {
                        const entryAccountIds = yield* repository.findEntryAccountIds(row.localRowId);

                        tracker.addAccountIds(entryAccountIds);
                    }

                    yield* repository.deleteRow(tableName, row.localRowId);
                    tracker.addDeleted(recordType, recordName);
                }

                yield* repository.removeOutbox(zone, recordName);
            }

            yield* recordRepository.remove(zone, recordName);
            yield* pendingRepository.remove(zone, recordName);
        });

        const findPausedZones = repository.findPausedZones(SYNC_RECORD_SCHEMA_VERSION);

        const apply = Effect.fn('SyncApplyService.apply')(
            function* (batch: SyncApplyBatchInterface) {
                const tracker = new SyncApplyTracker();

                yield* applyStateRepository.setApplying(true);

                const pausedZones = new Set((yield* findPausedZones).map(({ syncZone }) => syncZone));
                const fresh: SyncApplyItemInterface[] = [];

                for (const incoming of batch.records) {
                    const item = yield* intake(incoming, pausedZones, tracker);

                    if (isDefined(item)) {
                        fresh.push(item);
                    }
                }

                yield* processItems(fresh, tracker);

                for (const deletion of batch.deletions) {
                    yield* applyDeletion(deletion, pausedZones, tracker);
                }

                if (isNotEmptyArray(tracker.accountIds)) {
                    yield* balanceRefresher.refresh(tracker.accountIds);
                }

                yield* applyStateRepository.setApplying(false);

                for (const decision of tracker.pendingOutboxDecisions) {
                    if (isEmptyArray(decision.changedColumns)) {
                        yield* repository.removeOutbox(decision.syncZone, decision.syncId);
                    } else {
                        const changedColumns = yield* stringifySyncJson(decision.changedColumns);

                        yield* outboxRepository.enqueue({
                            recordType: decision.recordType,
                            syncZone: decision.syncZone,
                            syncId: decision.syncId,
                            operation: SyncOutboxOperationEnum.SAVE,
                            changedColumns
                        });
                    }
                }

                const merged = yield* derivedMatcher.mergeRecurringSeries(tracker.touchedSyncIds(SyncRecordTypeEnum.RECURRING_SERIES));

                const heldBack = yield* repository.countPending;
                const pausedZoneRows = yield* findPausedZones;

                return tracker.toResult(heldBack, pausedZoneRows, merged);
            },
            effect => Db.transaction(effect)
        );

        const resume = Effect.fn('SyncApplyService.resume')(function* () {
            const stillPaused = new Set((yield* findPausedZones).map(({ syncZone }) => syncZone));
            const rows = (yield* repository.findSchemaPaused).filter(({ syncZone }) => !stillPaused.has(syncZone));
            const records: SyncIncomingRecordInterface[] = [];
            const deletions: SyncIncomingDeletionInterface[] = [];

            for (const row of rows) {
                const raw = yield* Schema.decodeEffect(SYNC_JSON_UNKNOWN_SCHEMA)(row.payload).pipe(Effect.orDie);

                if (isRecord(raw) && raw['deletion'] === true) {
                    deletions.push({ recordType: row.recordType, recordName: row.syncId, zone: row.syncZone });
                } else {
                    records.push({ record: raw, systemFields: row.systemFields });
                }

                yield* pendingRepository.remove(row.syncZone, row.syncId);
            }

            return yield* apply({ records, deletions });
        });

        return {
            apply,
            resume,
            findPausedZones,
            resolveConflict: (record: SyncIncomingRecordInterface) => apply({ records: [record], deletions: [] })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncApplyService, SyncApplyService.make).pipe(
        Layer.provide([
            SyncApplyRepository.layer,
            SyncApplyStateRepository.layer,
            SyncOutboxRepository.layer,
            SyncRecordRepository.layer,
            SyncPendingRepository.layer,
            SyncApplyUnitService.layer,
            SyncDerivedMatcherService.layer
        ])
    );
}
