import { getTableColumns } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isRecord, isString } from '@rnw-community/shared';

import { Db } from '../../../@generic/service/db.service';
import { SyncOutboxOperationEnum } from '../../enum/sync-outbox-operation.enum';
import { SYNC_NATURAL_KEY_PROPERTIES } from '../../mapping/constant/sync-natural-key-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SYNC_RECORD_SCHEMA_VERSION } from '../../mapping/constant/sync-record-schema-version.constant';
import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { decodeSyncRecord } from '../../mapping/utils/decode-sync-record.util';
import { joinSplitTransactions } from '../../mapping/utils/join-split-transactions.util';
import { SyncApplyStateRepository } from '../../repository/sync-apply-state.repository';
import { SyncOutboxRepository } from '../../repository/sync-outbox.repository';
import { SyncPendingRepository } from '../../repository/sync-pending.repository';
import { SyncRecordRepository } from '../../repository/sync-record.repository';
import { SYNC_AUTHORSHIP_COLUMNS } from '../constant/sync-authorship-columns.constant';
import { SYNC_CHILD_NATURAL_KEYS } from '../constant/sync-child-natural-keys.constant';
import { SYNC_INSERT_PLACEHOLDERS } from '../constant/sync-insert-placeholders.constant';
import { SYNC_MOVED_FROM_FIELD, SYNC_MOVED_TO_FIELD } from '../constant/sync-moved-fields.constant';
import { SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE } from '../constant/sync-schema-paused.constant';
import { SyncApplyRepository } from '../repository/sync-apply.repository';
import { mergeSyncRow } from '../utils/merge-sync-row.util';
import { normalizeSyncCell } from '../utils/normalize-sync-cell.util';
import { SyncApplyTracker } from '../utils/sync-apply-tracker.util';

import { SyncAccountBalanceRefresher } from './sync-account-balance-refresher.service';
import { SyncDerivedMatcherService } from './sync-derived-matcher.service';

import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { SyncApplyBatchInterface } from '../interface/sync-apply-batch.interface';
import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';
import type { SyncApplyUnitInterface } from '../interface/sync-apply-unit.interface';
import type { SyncHeldItemInterface } from '../interface/sync-held-item.interface';
import type { SyncIncomingDeletionInterface } from '../interface/sync-incoming-deletion.interface';
import type { SyncIncomingRecordInterface } from '../interface/sync-incoming-record.interface';
import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncPreResolutionInterface } from '../interface/sync-pre-resolution.interface';
import type { SyncUnitOutcomeInterface } from '../interface/sync-unit-outcome.interface';
import type { SyncCellType } from '../type/sync-cell.type';

const TRANSACTIONS_TABLE = 'transactions';

type ResolutionsType = ReadonlyMap<SyncRowInterface, ReadonlyMap<string, number>>;

interface ChildSyncContextInterface {
    readonly resolutions: ResolutionsType;
    readonly unitIds: Map<string, number>;
    readonly baseRows: ReadonlyMap<string, SyncRowInterface>;
    readonly isGated: boolean;
}

export class SyncApplyService extends Context.Service<SyncApplyService>()('@budgie/contracts/SyncApplyService', {
    make: Effect.gen(function* () {
        const repository = yield* SyncApplyRepository;
        const applyStateRepository = yield* SyncApplyStateRepository;
        const outboxRepository = yield* SyncOutboxRepository;
        const recordRepository = yield* SyncRecordRepository;
        const pendingRepository = yield* SyncPendingRepository;
        const balanceRefresher = yield* SyncAccountBalanceRefresher;
        const derivedMatcher = yield* SyncDerivedMatcherService;

        const definitions = Object.values(SYNC_RECORD_DEFINITIONS);
        const descriptors: Record<string, SyncTableDescriptorInterface> = Object.fromEntries(
            definitions
                .filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG)
                .flatMap(definition => [definition.parent, ...definition.children.map(child => child.descriptor)])
                .map(descriptor => [descriptor.tableName, descriptor])
        );
        const searchTitleTables = new Set(['accounts', 'categories', 'tags']);
        const jsonUnknown = Schema.fromJsonString(Schema.Unknown);
        const jsonRecord = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown));
        const systemFieldsSchema = Schema.fromJsonString(Schema.Struct({ modifiedAt: Schema.optionalKey(Schema.Finite) }));
        const columnListSchema = Schema.fromJsonString(Schema.Array(Schema.String));

        const columnNameOf = (descriptor: SyncTableDescriptorInterface, property: string): string =>
            getTableColumns(descriptor.table)[property].name;
        const rowKey = (tableName: string, syncId: string): string => `${tableName}|${syncId}`;
        const itemKey = (item: SyncApplyItemInterface): string => `${item.decoded.zone}|${item.decoded.recordName}`;
        const identityOf = (localRow: SyncLocalRowInterface): string => `${localRow['sync_zone']}|${localRow['sync_id']}`;
        const readModifiedAt = (systemFields: string | null): number | null =>
            isString(systemFields)
                ? Option.match(Schema.decodeUnknownOption(systemFieldsSchema)(systemFields), {
                      onNone: () => null,
                      onSome: ({ modifiedAt }) => modifiedAt ?? null
                  })
                : null;
        const readChangedColumns = (changedColumns: string): readonly string[] =>
            Option.getOrElse(Schema.decodeUnknownOption(columnListSchema)(changedColumns), () => []);
        const readMovedField = (raw: unknown, field: string): string | null => {
            const fields = isRecord(raw) ? raw['encryptedFields'] : null;
            const moved = isRecord(fields) ? fields[field] : null;

            return isNotEmptyString(moved) ? moved : null;
        };
        const readZone = (raw: unknown): string => (isRecord(raw) && isString(raw['zone']) ? raw['zone'] : '');
        const linkMissing = (item: SyncApplyItemInterface): SyncRowReferenceInterface => ({
            column: '',
            tableName: 'transactions',
            kind: SyncReferenceKindEnum.SYNC_ID,
            key: item.decoded.linkId ?? item.decoded.recordName
        });

        const readStoredMovedTo = (payload: string | null): string | null =>
            isString(payload)
                ? readMovedField(Option.getOrNull(Schema.decodeUnknownOption(jsonUnknown)(payload)), SYNC_MOVED_TO_FIELD)
                : null;

        const redirectToZone = (item: SyncApplyItemInterface, zone: string): SyncApplyItemInterface => ({
            ...item,
            decoded: { ...item.decoded, zone, rows: item.decoded.rows.map(row => ({ ...row, syncZone: zone })) },
            envelopeJson: JSON.stringify({
                ...Option.getOrElse(Schema.decodeUnknownOption(jsonRecord)(item.envelopeJson), () => ({})),
                zone
            })
        });

        const toItem = Effect.fnUntraced(function* (raw: unknown, systemFields: string | null) {
            const decoded = yield* decodeSyncRecord(raw);

            return {
                decoded,
                envelopeJson: JSON.stringify(raw),
                systemFields,
                movedTo: readMovedField(raw, SYNC_MOVED_TO_FIELD),
                movedFrom: readMovedField(raw, SYNC_MOVED_FROM_FIELD)
            } satisfies SyncApplyItemInterface;
        });

        const toStoredItem = Effect.fnUntraced(function* (payload: string, systemFields: string | null) {
            const raw = yield* Schema.decodeUnknownEffect(jsonUnknown)(payload);

            return yield* toItem(raw, systemFields);
        });

        const holdPaused = (payload: string, systemFields: string | null, recordType: string, recordName: string, zone: string) =>
            pendingRepository.add({
                syncZone: zone,
                syncId: recordName,
                recordType,
                missingRecordType: SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE,
                missingSyncId: zone,
                systemFields,
                payload
            });

        const findSplitHomeLocalId = Effect.fnUntraced(function* (linkId: string) {
            for (const record of yield* repository.findFamilyRecords(linkId)) {
                const localId =
                    record.syncId === linkId ? null : yield* repository.findLocalId(TRANSACTIONS_TABLE, record.syncZone, record.syncId);

                if (isDefined(localId)) {
                    return localId;
                }
            }

            return null;
        });

        const resolveReference = Effect.fnUntraced(function* (
            reference: SyncRowReferenceInterface,
            zone: string,
            unitIds: ReadonlyMap<string, number>
        ) {
            if (reference.kind === SyncReferenceKindEnum.NATURAL_KEY) {
                return yield* repository.findNaturalKeyId(
                    reference.tableName,
                    SYNC_NATURAL_KEY_PROPERTIES[reference.tableName],
                    reference.key
                );
            }

            const localId =
                unitIds.get(rowKey(reference.tableName, reference.key)) ??
                (yield* repository.findLocalId(reference.tableName, zone, reference.key));

            return localId ?? (reference.tableName === TRANSACTIONS_TABLE ? yield* findSplitHomeLocalId(reference.key) : null);
        });

        const preResolve = Effect.fnUntraced(function* (rows: readonly SyncRowInterface[], unitKeys: ReadonlySet<string>) {
            const resolutions = new Map<SyncRowInterface, ReadonlyMap<string, number>>();

            for (const row of rows) {
                const rowResolutions = new Map<string, number>();

                for (const reference of row.references) {
                    const isInUnit =
                        reference.kind === SyncReferenceKindEnum.SYNC_ID && unitKeys.has(rowKey(reference.tableName, reference.key));

                    if (!isInUnit) {
                        const localId = yield* resolveReference(reference, row.syncZone, new Map());

                        if (!isDefined(localId)) {
                            return { missing: reference, resolutions } satisfies SyncPreResolutionInterface;
                        }

                        rowResolutions.set(reference.column, localId);
                    }
                }

                resolutions.set(row, rowResolutions);
            }

            return { missing: null, resolutions } satisfies SyncPreResolutionInterface;
        });

        const referenceIdOf = (
            row: SyncRowInterface,
            column: string,
            resolutions: ResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): number | null => {
            const reference = row.references.find(candidate => candidate.column === column);

            return isDefined(reference)
                ? (resolutions.get(row)?.get(column) ?? unitIds.get(rowKey(reference.tableName, reference.key)) ?? null)
                : null;
        };

        const toLocalCells = (descriptor: SyncTableDescriptorInterface, localRow: SyncLocalRowInterface): Record<string, SyncCellType> =>
            Object.fromEntries(
                descriptor.columns.map(column => [column.property, normalizeSyncCell(localRow[columnNameOf(descriptor, column.property)])])
            );

        const toServerCells = (
            descriptor: SyncTableDescriptorInterface,
            row: SyncRowInterface,
            resolutions: ResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): Record<string, SyncCellType | undefined> =>
            Object.fromEntries(
                descriptor.columns.map(column => {
                    if (isDefined(column.reference)) {
                        return [column.property, referenceIdOf(row, column.property, resolutions, unitIds)];
                    }

                    return [column.property, column.property in row.values ? normalizeSyncCell(row.values[column.property]) : undefined];
                })
            );

        const toBaseCells = Effect.fnUntraced(function* (
            descriptor: SyncTableDescriptorInterface,
            row: SyncRowInterface,
            unitIds: ReadonlyMap<string, number>
        ) {
            const cells: Record<string, SyncCellType> = {};

            for (const column of descriptor.columns) {
                if (isDefined(column.reference)) {
                    const reference = row.references.find(candidate => candidate.column === column.property);
                    const localId = isDefined(reference) ? yield* resolveReference(reference, row.syncZone, unitIds) : null;

                    if (localId !== null || !isDefined(reference)) {
                        cells[column.property] = localId;
                    }
                } else if (column.property in row.values) {
                    cells[column.property] = normalizeSyncCell(row.values[column.property]);
                }
            }

            return cells;
        });

        const buildInsertColumns = (
            descriptor: SyncTableDescriptorInterface,
            row: SyncRowInterface,
            resolutions: ResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): Record<string, SyncCellType> => ({
            sync_id: row.syncId,
            sync_zone: row.syncZone,
            ...SYNC_INSERT_PLACEHOLDERS[row.tableName]?.(row.syncId),
            ...Object.fromEntries(
                Object.entries(row.values).map(([property, value]) => [columnNameOf(descriptor, property), normalizeSyncCell(value)])
            ),
            ...Object.fromEntries(
                row.references.map(reference => [
                    columnNameOf(descriptor, reference.column),
                    referenceIdOf(row, reference.column, resolutions, unitIds)
                ])
            )
        });

        const diffCells = (
            descriptor: SyncTableDescriptorInterface,
            merged: Readonly<Record<string, SyncCellType>>,
            local: Readonly<Record<string, SyncCellType>>
        ): Record<string, SyncCellType> =>
            Object.fromEntries(
                Object.keys(merged)
                    .filter(property => merged[property] !== (local[property] ?? null))
                    .map(property => [columnNameOf(descriptor, property), merged[property]])
            );

        const insertRowFor = Effect.fnUntraced(function* (
            row: SyncRowInterface,
            resolutions: ResolutionsType,
            unitIds: Map<string, number>
        ) {
            const descriptor = descriptors[row.tableName];
            const columns = buildInsertColumns(descriptor, row, resolutions, unitIds);
            const movedChild = isDefined(descriptor.parentLink) ? yield* repository.findRow(row.tableName, row.syncZone, row.syncId) : null;

            if (isDefined(movedChild)) {
                yield* repository.updateRow(row.tableName, movedChild.__localId, columns);
                unitIds.set(rowKey(row.tableName, row.syncId), movedChild.__localId);

                return movedChild.__localId;
            }

            const localId = yield* repository.insertRow(row.tableName, columns);

            unitIds.set(rowKey(row.tableName, row.syncId), localId);

            if (searchTitleTables.has(row.tableName)) {
                yield* repository.refreshSearchTitle(row.tableName, localId);
            }

            return localId;
        });

        const loadBaseRows = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const baseItems: SyncApplyItemInterface[] = [];

            for (const source of unit.sources) {
                const stored = yield* recordRepository.find(source.decoded.zone, source.decoded.recordName);

                if (isDefined(stored) && isString(stored.payload)) {
                    const baseItem = yield* Effect.result(toStoredItem(stored.payload, stored.systemFields));

                    if (Result.isSuccess(baseItem)) {
                        baseItems.push(baseItem.success);
                    }
                }
            }

            const baseRecords =
                baseItems.length === unit.sources.length
                    ? joinSplitTransactions(baseItems.map(({ decoded }) => decoded)).joined
                    : baseItems.map(({ decoded }) => decoded);

            return new Map<string, SyncRowInterface>(
                baseRecords.flatMap(({ rows }) => rows).map(row => [rowKey(row.tableName, row.syncId), row])
            );
        });

        const syncChildTable = Effect.fnUntraced(function* (
            unit: SyncApplyUnitInterface,
            tableName: string,
            parentLocalId: number,
            context: ChildSyncContextInterface
        ) {
            const { resolutions, unitIds, baseRows, isGated } = context;
            const descriptor = descriptors[tableName];
            const parentProperty = descriptor.parentLink?.property ?? '';
            const serverRows = unit.decoded.rows.filter(row => row.tableName === tableName);
            const localRows = yield* repository.findChildren(tableName, columnNameOf(descriptor, parentProperty), parentLocalId);
            const authorship = SYNC_AUTHORSHIP_COLUMNS[tableName] ?? null;
            const naturalKeys = SYNC_CHILD_NATURAL_KEYS[tableName] ?? [];
            const serverIdentities = new Set(serverRows.map(row => `${row.syncZone}|${row.syncId}`));
            const localByIdentity = new Map(localRows.map(localRow => [identityOf(localRow), localRow]));
            const matchedLocalIds = new Set<number>();
            const keptColumns: string[] = [];
            let isWritten = false;

            for (const serverRow of serverRows) {
                const serverCells = toServerCells(descriptor, serverRow, resolutions, unitIds);
                const exactLocal = localByIdentity.get(`${serverRow.syncZone}|${serverRow.syncId}`);
                const adoptedLocal =
                    isDefined(exactLocal) || isEmptyArray(naturalKeys)
                        ? undefined
                        : localRows.find(
                              candidate =>
                                  !matchedLocalIds.has(candidate.__localId) &&
                                  !serverIdentities.has(identityOf(candidate)) &&
                                  naturalKeys.every(property => toLocalCells(descriptor, candidate)[property] === serverCells[property])
                          );
                const localRow = exactLocal ?? adoptedLocal;
                const baseRow = baseRows.get(rowKey(tableName, serverRow.syncId));

                if (!isDefined(localRow)) {
                    if (isGated && isDefined(baseRow)) {
                        keptColumns.push(tableName);
                    } else {
                        yield* insertRowFor(serverRow, resolutions, unitIds);
                        isWritten = true;
                    }
                } else {
                    matchedLocalIds.add(localRow.__localId);

                    if (isDefined(adoptedLocal)) {
                        yield* repository.updateRow(tableName, localRow.__localId, {
                            sync_id: serverRow.syncId,
                            sync_zone: serverRow.syncZone
                        });
                    }

                    const localCells = toLocalCells(descriptor, localRow);
                    const baseCells = isDefined(baseRow) ? yield* toBaseCells(descriptor, baseRow, unitIds) : null;
                    const result = mergeSyncRow({
                        local: localCells,
                        base: baseCells,
                        server: serverCells,
                        localChanged: isGated ? null : new Set(),
                        authorship
                    });
                    const updates = diffCells(descriptor, result.merged, localCells);

                    if (isNotEmptyArray(Object.keys(updates))) {
                        yield* repository.updateRow(tableName, localRow.__localId, updates);
                        isWritten = true;
                    }

                    if (isNotEmptyArray(result.keptLocal)) {
                        keptColumns.push(tableName);
                    }
                }
            }

            for (const localRow of localRows.filter(candidate => !matchedLocalIds.has(candidate.__localId))) {
                if (!serverIdentities.has(identityOf(localRow))) {
                    const baseRow = baseRows.get(rowKey(tableName, `${localRow['sync_id']}`));
                    const localCells = toLocalCells(descriptor, localRow);
                    const baseCells = isDefined(baseRow) ? yield* toBaseCells(descriptor, baseRow, unitIds) : null;
                    const isUnchanged =
                        isDefined(baseCells) && Object.entries(baseCells).every(([property, cell]) => localCells[property] === cell);

                    if (!isGated || isUnchanged) {
                        yield* repository.deleteRow(tableName, localRow.__localId);
                        isWritten = true;
                    } else {
                        keptColumns.push(tableName);
                    }
                }
            }

            return { isWritten, keptColumns };
        });

        const rezoneMovedRow = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const { decoded, movedFrom } = unit;

            if (!isNotEmptyString(movedFrom)) {
                return;
            }

            const parentTable = SYNC_RECORD_DEFINITIONS[decoded.recordType].parent.tableName;
            const existing = yield* repository.findRow(parentTable, decoded.zone, decoded.recordName);
            const source = isDefined(existing) ? null : yield* repository.findRow(parentTable, movedFrom, decoded.recordName);

            if (!isDefined(source)) {
                return;
            }

            yield* repository.updateRow(parentTable, source.__localId, { sync_zone: decoded.zone });

            for (const tableName of new Set(
                SYNC_RECORD_DEFINITIONS[decoded.recordType].children.map(child => child.descriptor.tableName)
            )) {
                const descriptor = descriptors[tableName];
                const incomingIds = new Set(decoded.rows.filter(row => row.tableName === tableName).map(row => row.syncId));
                const localRows = yield* repository.findChildren(
                    tableName,
                    columnNameOf(descriptor, descriptor.parentLink?.property ?? ''),
                    source.__localId
                );

                for (const localRow of localRows.filter(candidate => incomingIds.has(`${candidate['sync_id']}`))) {
                    yield* repository.updateRow(tableName, localRow.__localId, { sync_zone: decoded.zone });
                }
            }
        });

        const absorbStandaloneLegs = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const accountIds: number[] = [];
            const legs =
                unit.decoded.linkId === null
                    ? []
                    : unit.sources.filter(({ decoded }) => decoded.recordType === SyncRecordTypeEnum.TRANSACTION_LEG);

            for (const source of legs) {
                const standalone = yield* repository.findRow('transactions', source.decoded.zone, source.decoded.recordName);

                if (isDefined(standalone)) {
                    accountIds.push(...(yield* repository.findEntryAccountIds(standalone.__localId)));
                    yield* repository.deleteRow('transactions', standalone.__localId);
                }
            }

            return accountIds;
        });

        const redirectMovedUnit = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const [source] = unit.sources;
            const { decoded } = unit;

            if (
                isNotEmptyString(unit.movedTo) ||
                isNotEmptyString(unit.movedFrom) ||
                unit.sources.length !== 1 ||
                decoded.recordType === SyncRecordTypeEnum.TRANSACTION_LEG ||
                isDefined(decoded.linkId)
            ) {
                return unit;
            }

            const parentTable = SYNC_RECORD_DEFINITIONS[decoded.recordType].parent.tableName;

            if (isDefined(yield* repository.findRow(parentTable, decoded.zone, decoded.recordName))) {
                return unit;
            }

            const stored = yield* recordRepository.find(decoded.zone, decoded.recordName);
            const movedTo = readStoredMovedTo(stored?.payload ?? null);

            if (!isNotEmptyString(movedTo) || !isDefined(yield* repository.findRow(parentTable, movedTo, decoded.recordName))) {
                return unit;
            }

            const redirected = redirectToZone(source, movedTo);

            return { ...unit, incoming: [redirected], sources: [redirected], decoded: redirected.decoded } satisfies SyncApplyUnitInterface;
        });

        const applyUnit = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const { decoded } = unit;
            const definition = SYNC_RECORD_DEFINITIONS[decoded.recordType];
            const parentTable = definition.parent.tableName;
            const parentDescriptor = definition.parent;
            const [parentRow] = decoded.rows;
            const parentKey = rowKey(parentTable, parentRow.syncId);
            const done: SyncUnitOutcomeInterface = { missing: null, isWritten: false, touchedRows: [], accountIds: [], keptColumns: null };
            const held = (missing: SyncRowReferenceInterface): SyncUnitOutcomeInterface => ({ ...done, missing });

            if (isNotEmptyString(unit.movedTo)) {
                const target = yield* repository.findRow(parentTable, unit.movedTo, decoded.recordName);

                return isDefined(target)
                    ? done
                    : held({ column: '', tableName: parentTable, kind: SyncReferenceKindEnum.SYNC_ID, key: decoded.recordName });
            }

            const outbox = yield* repository.findOutbox(decoded.zone, decoded.recordName);

            if (outbox?.operation === SyncOutboxOperationEnum.DELETE) {
                return done;
            }

            const unitKeys = new Set(decoded.rows.map(row => rowKey(row.tableName, row.syncId)));
            const { missing, resolutions } = yield* preResolve(decoded.rows, unitKeys);

            if (isDefined(missing)) {
                return held(missing);
            }

            yield* rezoneMovedRow(unit);

            const localParent = yield* repository.findRow(parentTable, decoded.zone, decoded.recordName);
            const unitIds = new Map<string, number>();
            const accountIds: number[] = [...(yield* absorbStandaloneLegs(unit))];
            const touchedRows: Array<readonly [string, string]> = [];
            let isWritten = false;
            let keptColumns: string[] | null = null;

            if (!isDefined(localParent)) {
                for (const row of decoded.rows) {
                    yield* insertRowFor(row, resolutions, unitIds);
                    touchedRows.push([row.tableName, row.syncId]);
                }

                isWritten = true;
            } else {
                const parentLocalId = localParent.__localId;
                const changedColumns = isDefined(outbox) ? readChangedColumns(outbox.changedColumns) : [];
                const baseRows = yield* loadBaseRows(unit);
                const localCells = toLocalCells(parentDescriptor, localParent);
                const baseParent = baseRows.get(parentKey);
                const baseCells = isDefined(baseParent) ? yield* toBaseCells(parentDescriptor, baseParent, unitIds) : null;
                const changedProperties = new Set(
                    parentDescriptor.columns
                        .filter(column => changedColumns.includes(columnNameOf(parentDescriptor, column.property)))
                        .map(column => column.property)
                );

                unitIds.set(parentKey, parentLocalId);

                if (decoded.recordType === SyncRecordTypeEnum.TRANSACTION) {
                    accountIds.push(...(yield* repository.findEntryAccountIds(parentLocalId)));
                }

                const result = mergeSyncRow({
                    local: localCells,
                    base: baseCells,
                    server: toServerCells(parentDescriptor, parentRow, resolutions, unitIds),
                    localChanged: changedProperties,
                    authorship: SYNC_AUTHORSHIP_COLUMNS[parentTable] ?? null
                });
                const updates = diffCells(parentDescriptor, result.merged, localCells);
                const kept = result.keptLocal.map(property => columnNameOf(parentDescriptor, property));

                if (isNotEmptyArray(Object.keys(updates))) {
                    yield* repository.updateRow(parentTable, parentLocalId, updates);
                    yield* searchTitleTables.has(parentTable) ? repository.refreshSearchTitle(parentTable, parentLocalId) : Effect.void;
                    isWritten = true;
                }

                touchedRows.push([parentTable, parentRow.syncId]);

                for (const tableName of new Set(definition.children.map(child => child.descriptor.tableName))) {
                    const childResult = yield* syncChildTable(unit, tableName, parentLocalId, {
                        resolutions,
                        unitIds,
                        baseRows,
                        isGated: isDefined(outbox) && changedColumns.includes(tableName)
                    });

                    kept.push(...childResult.keptColumns);
                    isWritten = isWritten || childResult.isWritten;

                    if (childResult.isWritten) {
                        touchedRows.push(
                            ...decoded.rows.filter(row => row.tableName === tableName).map(row => [tableName, row.syncId] as const)
                        );
                    }
                }

                keptColumns = isDefined(outbox) ? [...new Set(kept)].sort() : null;
            }

            const localParentId = unitIds.get(parentKey);

            if (isDefined(localParentId)) {
                if (decoded.recordType === SyncRecordTypeEnum.TRANSACTION) {
                    accountIds.push(...(yield* repository.findEntryAccountIds(localParentId)));
                } else if (decoded.recordType === SyncRecordTypeEnum.ACCOUNT) {
                    accountIds.push(localParentId);
                }
            }

            if (decoded.recordType === SyncRecordTypeEnum.DEBT_EVENT) {
                accountIds.push(...[resolutions.get(parentRow)?.get('debtAccountId')].filter(isDefined));
            }

            return { missing: null, isWritten, touchedRows, accountIds, keptColumns } satisfies SyncUnitOutcomeInterface;
        });

        const inSavepoint = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
            repository.savepoint().pipe(
                Effect.andThen(Effect.result(effect)),
                Effect.flatMap(result =>
                    (Result.isSuccess(result) ? repository.releaseSavepoint() : repository.rollbackSavepoint()).pipe(Effect.as(result))
                )
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
                const counterpart = yield* Effect.result(toStoredItem(`${record.payload}`, record.systemFields));

                if (Result.isSuccess(counterpart)) {
                    counterparts.push(counterpart.success);
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
                    const item = yield* Effect.result(toStoredItem(row.payload, row.systemFields));

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
                    const unit = yield* redirectMovedUnit(rawUnit);
                    const attempt = yield* inSavepoint(applyUnit(unit));

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
            const decodedResult = yield* Effect.result(toItem(incoming.record, incoming.systemFields));

            if (Result.isFailure(decodedResult)) {
                const error = decodedResult.failure;

                if (error._tag === 'SyncSchemaVersionUnsupportedError') {
                    const zone = readZone(incoming.record);

                    pausedZones.add(zone);
                    yield* holdPaused(JSON.stringify(incoming.record), incoming.systemFields, error.recordType, error.recordName, zone);
                } else {
                    tracker.reject({ recordType: error.recordType, recordName: error.recordName, reason: error.message });
                }

                return null;
            }

            const item = decodedResult.success;
            const { zone, recordName, recordType } = item.decoded;

            if (pausedZones.has(zone)) {
                yield* holdPaused(item.envelopeJson, item.systemFields, recordType, recordName, zone);

                return null;
            }

            const pending = yield* repository.findPending(zone, recordName);
            const stored = yield* recordRepository.find(zone, recordName);
            const isStoredTombstone = isDefined(stored) && isNotEmptyString(readStoredMovedTo(stored.payload));
            const latest = isDefined(pending) ? pending : isStoredTombstone ? undefined : stored;

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
                yield* holdPaused(JSON.stringify({ deletion: true, recordType, recordName, zone }), null, recordType, recordName, zone);
                tracker.skip();

                return;
            }

            const definition = definitions.find(candidate => candidate.recordType === recordType);

            if (isDefined(definition)) {
                const tableName =
                    definition.recordType === SyncRecordTypeEnum.TRANSACTION_LEG ? 'transactions' : definition.parent.tableName;
                const row = yield* repository.findRow(tableName, zone, recordName);

                if (isDefined(row)) {
                    if (tableName === 'transactions') {
                        tracker.addAccountIds(yield* repository.findEntryAccountIds(row.__localId));
                    }

                    yield* repository.deleteRow(tableName, row.__localId);
                    tracker.addDeleted(recordType, recordName);
                }

                yield* repository.removeOutbox(zone, recordName);
            }

            yield* recordRepository.remove(zone, recordName);
            yield* pendingRepository.remove(zone, recordName);
        });

        const findPausedZones = () => repository.findPausedZones(SYNC_RECORD_SCHEMA_VERSION);

        const apply = Effect.fn('SyncApplyService.apply')(
            function* (batch: SyncApplyBatchInterface) {
                const tracker = new SyncApplyTracker();

                yield* applyStateRepository.setApplying(true);

                const pausedZones = new Set((yield* findPausedZones()).map(({ syncZone }) => syncZone));
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
                        yield* outboxRepository.enqueue({
                            recordType: decision.recordType,
                            syncZone: decision.syncZone,
                            syncId: decision.syncId,
                            operation: SyncOutboxOperationEnum.SAVE,
                            changedColumns: JSON.stringify(decision.changedColumns)
                        });
                    }
                }

                const merged = yield* derivedMatcher.mergeRecurringSeries(tracker.touchedSyncIds(SyncRecordTypeEnum.RECURRING_SERIES));

                return tracker.toResult(yield* repository.countPending(), yield* findPausedZones(), merged);
            },
            effect => Db.transaction(effect)
        );

        const resume = Effect.fn('SyncApplyService.resume')(function* () {
            const stillPaused = new Set((yield* findPausedZones()).map(({ syncZone }) => syncZone));
            const rows = (yield* repository.findSchemaPaused()).filter(({ syncZone }) => !stillPaused.has(syncZone));
            const records: SyncIncomingRecordInterface[] = [];
            const deletions: SyncIncomingDeletionInterface[] = [];

            for (const row of rows) {
                const raw = yield* Schema.decodeUnknownEffect(jsonUnknown)(row.payload).pipe(Effect.orDie);

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
            SyncDerivedMatcherService.layer
        ])
    );
}
