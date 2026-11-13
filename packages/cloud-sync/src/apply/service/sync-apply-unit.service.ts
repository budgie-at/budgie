import { SyncOutboxOperationEnum, SyncRecordRepository, SyncRecordTypeEnum } from '@budgie/contracts';
import { getTableColumns } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { isBoolean, isNumber, isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isString } from '@rnw-community/shared';

import { SYNC_NATURAL_KEY_PROPERTIES } from '../../mapping/constant/sync-natural-key-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { joinSplitTransactions } from '../../mapping/utils/join-split-transactions.util';
import { SYNC_AUTHORSHIP_COLUMNS } from '../constant/sync-authorship-columns.constant';
import { SYNC_CHILD_NATURAL_KEYS } from '../constant/sync-child-natural-keys.constant';
import { SYNC_INSERT_PLACEHOLDERS } from '../constant/sync-insert-placeholders.constant';
import { SyncApplyRepository } from '../repository/sync-apply.repository';
import { mergeSyncRow } from '../utils/merge-sync-row.util';
import { readStoredMovedTo } from '../utils/read-stored-moved-to.util';
import { stringifySyncJson } from '../utils/stringify-sync-json.util';
import { toStoredSyncApplyItem } from '../utils/to-stored-sync-apply-item.util';

import { SyncEntryBaseValuationGuard } from './sync-entry-base-valuation-guard.service';

import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { ChildSyncContextInterface } from '../interface/child-sync-context.interface';
import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';
import type { SyncApplyUnitInterface } from '../interface/sync-apply-unit.interface';
import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncPreResolutionInterface } from '../interface/sync-pre-resolution.interface';
import type { SyncUnitOutcomeInterface } from '../interface/sync-unit-outcome.interface';
import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

const TRANSACTIONS_TABLE = 'transactions';

export class SyncApplyUnitService extends Context.Service<SyncApplyUnitService>()('@budgie/cloud-sync/SyncApplyUnitService', {
    make: Effect.gen(function* () {
        const getSyncRowKey = (tableName: string, syncId: string): string => `${tableName}|${syncId}`;

        const getSyncColumnName = (descriptor: SyncTableDescriptorInterface, property: string): string =>
            getTableColumns(descriptor.table)[property].name;

        const normalizeSyncCell = (value: unknown): SyncCellType => {
            if (value instanceof Date) {
                return Math.floor(value.getTime() / 1000);
            }

            if (isBoolean(value)) {
                return value ? 1 : 0;
            }

            return isString(value) || isNumber(value) ? value : null;
        };

        const readSyncReferenceId = (
            row: SyncRowInterface,
            column: string,
            resolutions: SyncResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): number | null => {
            const reference = row.references.find(candidate => candidate.column === column);

            return isDefined(reference)
                ? (resolutions.get(row)?.get(column) ?? unitIds.get(getSyncRowKey(reference.tableName, reference.key)) ?? null)
                : null;
        };

        const buildSyncInsertColumns = (
            descriptor: SyncTableDescriptorInterface,
            row: SyncRowInterface,
            resolutions: SyncResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): Record<string, SyncCellType> => ({
            sync_id: row.syncId,
            sync_zone: row.syncZone,
            ...SYNC_INSERT_PLACEHOLDERS[row.tableName]?.(row.syncId),
            ...Object.fromEntries(
                Object.entries(row.values).map(([property, value]) => [getSyncColumnName(descriptor, property), normalizeSyncCell(value)])
            ),
            ...Object.fromEntries(
                row.references.map(reference => [
                    getSyncColumnName(descriptor, reference.column),
                    readSyncReferenceId(row, reference.column, resolutions, unitIds)
                ])
            )
        });
        const diffSyncCells = (
            descriptor: SyncTableDescriptorInterface,
            merged: Readonly<Record<string, SyncCellType>>,
            local: Readonly<Record<string, SyncCellType>>
        ): Record<string, SyncCellType> =>
            Object.fromEntries(
                Object.keys(merged)
                    .filter(property => merged[property] !== (local[property] ?? null))
                    .map(property => [getSyncColumnName(descriptor, property), merged[property]])
            );
        const toLocalCells = (descriptor: SyncTableDescriptorInterface, localRow: SyncLocalRowInterface): Record<string, SyncCellType> =>
            Object.fromEntries(
                descriptor.columns.map(column => [
                    column.property,
                    normalizeSyncCell(localRow[getSyncColumnName(descriptor, column.property)])
                ])
            );
        const toServerCells = (
            descriptor: SyncTableDescriptorInterface,
            row: SyncRowInterface,
            resolutions: SyncResolutionsType,
            unitIds: ReadonlyMap<string, number>
        ): Record<string, SyncCellType> =>
            Object.fromEntries(
                descriptor.columns.flatMap(column => {
                    if (isDefined(column.reference)) {
                        return [[column.property, readSyncReferenceId(row, column.property, resolutions, unitIds)]];
                    }

                    return column.property in row.values ? [[column.property, normalizeSyncCell(row.values[column.property])]] : [];
                })
            );
        const repository = yield* SyncApplyRepository;
        const recordRepository = yield* SyncRecordRepository;
        const entryBaseValuationGuard = yield* SyncEntryBaseValuationGuard;

        const descriptors: Record<string, SyncTableDescriptorInterface> = Object.fromEntries(
            Object.values(SYNC_RECORD_DEFINITIONS)
                .filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG)
                .flatMap(definition => [definition.parent, ...definition.children.map(child => child.descriptor)])
                .map(descriptor => [descriptor.tableName, descriptor])
        );
        const searchTitleTables = new Set(['accounts', 'categories', 'tags']);
        const jsonRecord = Schema.Record(Schema.String, Schema.Unknown).pipe(Schema.fromJsonString);
        const columnListSchema = Schema.String.pipe(Schema.Array, Schema.fromJsonString);

        const identityOf = (localRow: SyncLocalRowInterface): string => `${String(localRow['sync_zone'])}|${String(localRow['sync_id'])}`;
        const readChangedColumns = (changedColumns: string): readonly string[] =>
            Option.getOrElse(Schema.decodeOption(columnListSchema)(changedColumns), () => []);

        const redirectToZone = Effect.fnUntraced(function* (item: SyncApplyItemInterface, zone: string) {
            const envelope = Option.getOrElse(Schema.decodeOption(jsonRecord)(item.envelopeJson), () => ({}));
            const envelopeJson = yield* stringifySyncJson({ ...envelope, zone });

            return {
                ...item,
                decoded: { ...item.decoded, zone, rows: item.decoded.rows.map(row => ({ ...row, syncZone: zone })) },
                envelopeJson
            } satisfies SyncApplyItemInterface;
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
                unitIds.get(getSyncRowKey(reference.tableName, reference.key)) ??
                (yield* repository.findLocalId(reference.tableName, zone, reference.key));

            return localId ?? (reference.tableName === TRANSACTIONS_TABLE ? yield* findSplitHomeLocalId(reference.key) : null);
        });

        const preResolve = Effect.fnUntraced(function* (rows: readonly SyncRowInterface[], unitKeys: ReadonlySet<string>) {
            const resolutions = new Map<SyncRowInterface, ReadonlyMap<string, number>>();

            for (const row of rows) {
                const rowResolutions = new Map<string, number>();

                for (const reference of row.references) {
                    const isInUnit =
                        reference.kind === SyncReferenceKindEnum.SYNC_ID && unitKeys.has(getSyncRowKey(reference.tableName, reference.key));

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

                    if (isDefined(localId) || !isDefined(reference)) {
                        cells[column.property] = localId;
                    }
                } else if (column.property in row.values) {
                    cells[column.property] = normalizeSyncCell(row.values[column.property]);
                }
            }

            return cells;
        });

        const insertRowFor = Effect.fnUntraced(function* (
            row: SyncRowInterface,
            resolutions: SyncResolutionsType,
            unitIds: Map<string, number>
        ) {
            const descriptor = descriptors[row.tableName];
            const columns = buildSyncInsertColumns(descriptor, row, resolutions, unitIds);
            const movedChild = isDefined(descriptor.parentLink) ? yield* repository.findRow(row.tableName, row.syncZone, row.syncId) : null;

            if (isDefined(movedChild)) {
                yield* repository.updateRow(row.tableName, movedChild.localRowId, columns);
                unitIds.set(getSyncRowKey(row.tableName, row.syncId), movedChild.localRowId);

                return movedChild.localRowId;
            }

            const localId = yield* repository.insertRow(row.tableName, columns);

            unitIds.set(getSyncRowKey(row.tableName, row.syncId), localId);

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
                    const baseItem = yield* Effect.result(toStoredSyncApplyItem(stored.payload, stored.systemFields));

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
                baseRecords.flatMap(({ rows }) => rows).map(row => [getSyncRowKey(row.tableName, row.syncId), row])
            );
        });

        const syncChildTable = Effect.fnUntraced(function* (
            unit: SyncApplyUnitInterface,
            tableName: string,
            parentLocalId: number,
            context: ChildSyncContextInterface
        ) {
            const { resolutions, unitIds, baseRows, isGated, isParentTimingUnchanged } = context;
            const descriptor = descriptors[tableName];
            const parentProperty = descriptor.parentLink?.property ?? '';
            const serverRows = unit.decoded.rows.filter(row => row.tableName === tableName);
            const localRows = yield* repository.findChildren(tableName, getSyncColumnName(descriptor, parentProperty), parentLocalId);
            const guardBaseValuation = yield* entryBaseValuationGuard.forRows(tableName, localRows, isParentTimingUnchanged);
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
                        ? null
                        : (localRows.find(
                              candidate =>
                                  !matchedLocalIds.has(candidate.localRowId) &&
                                  !serverIdentities.has(identityOf(candidate)) &&
                                  naturalKeys.every(property => toLocalCells(descriptor, candidate)[property] === serverCells[property])
                          ) ?? null);
                const localRow = exactLocal ?? adoptedLocal;
                const baseRow = baseRows.get(getSyncRowKey(tableName, serverRow.syncId));

                if (isDefined(localRow)) {
                    matchedLocalIds.add(localRow.localRowId);

                    if (isDefined(adoptedLocal)) {
                        yield* repository.updateRow(tableName, localRow.localRowId, {
                            sync_id: serverRow.syncId,
                            sync_zone: serverRow.syncZone
                        });
                    }

                    const localCells = toLocalCells(descriptor, localRow);
                    const baseCells = isDefined(baseRow) ? yield* toBaseCells(descriptor, baseRow, unitIds) : null;
                    const result = mergeSyncRow({
                        local: localCells,
                        base: baseCells,
                        server: guardBaseValuation(localCells, serverCells),
                        localChanged: isGated ? null : new Set(),
                        authorship
                    });
                    const updates = diffSyncCells(descriptor, result.merged, localCells);

                    if (isNotEmptyArray(Object.keys(updates))) {
                        yield* repository.updateRow(tableName, localRow.localRowId, updates);
                        isWritten = true;
                    }

                    if (isNotEmptyArray(result.keptLocal)) {
                        keptColumns.push(tableName);
                    }
                } else if (isGated && isDefined(baseRow)) {
                    keptColumns.push(tableName);
                } else {
                    yield* insertRowFor(serverRow, resolutions, unitIds);
                    isWritten = true;
                }
            }

            for (const localRow of localRows.filter(candidate => !matchedLocalIds.has(candidate.localRowId))) {
                if (!serverIdentities.has(identityOf(localRow))) {
                    const baseRow = baseRows.get(getSyncRowKey(tableName, String(localRow['sync_id'])));
                    const localCells = toLocalCells(descriptor, localRow);
                    const baseCells = isDefined(baseRow) ? yield* toBaseCells(descriptor, baseRow, unitIds) : null;
                    const isUnchanged =
                        isDefined(baseCells) && Object.entries(baseCells).every(([property, cell]) => localCells[property] === cell);

                    if (!isGated || isUnchanged) {
                        yield* repository.deleteRow(tableName, localRow.localRowId);
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

            yield* repository.updateRow(parentTable, source.localRowId, { sync_zone: decoded.zone });

            for (const tableName of new Set(
                SYNC_RECORD_DEFINITIONS[decoded.recordType].children.map(child => child.descriptor.tableName)
            )) {
                const descriptor = descriptors[tableName];
                const incomingIds = new Set(decoded.rows.filter(row => row.tableName === tableName).map(row => row.syncId));
                const localRows = yield* repository.findChildren(
                    tableName,
                    getSyncColumnName(descriptor, descriptor.parentLink?.property ?? ''),
                    source.localRowId
                );

                for (const localRow of localRows.filter(candidate => incomingIds.has(String(candidate['sync_id'])))) {
                    yield* repository.updateRow(tableName, localRow.localRowId, { sync_zone: decoded.zone });
                }
            }
        });

        const absorbStandaloneLegs = Effect.fnUntraced(function* (unit: SyncApplyUnitInterface) {
            const accountIds: number[] = [];
            const legs = isDefined(unit.decoded.linkId)
                ? unit.sources.filter(({ decoded }) => decoded.recordType === SyncRecordTypeEnum.TRANSACTION_LEG)
                : [];

            for (const source of legs) {
                const standalone = yield* repository.findRow('transactions', source.decoded.zone, source.decoded.recordName);

                if (isDefined(standalone)) {
                    const entryAccountIds = yield* repository.findEntryAccountIds(standalone.localRowId);

                    accountIds.push(...entryAccountIds);
                    yield* repository.deleteRow('transactions', standalone.localRowId);
                }
            }

            return accountIds;
        });

        const redirectMovedUnit = Effect.fn('SyncApplyUnitService.redirectMovedUnit')(function* (unit: SyncApplyUnitInterface) {
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

            const existingParent = yield* repository.findRow(parentTable, decoded.zone, decoded.recordName);

            if (isDefined(existingParent)) {
                return unit;
            }

            const stored = yield* recordRepository.find(decoded.zone, decoded.recordName);
            const movedTo = readStoredMovedTo(stored?.payload ?? null);

            const movedParent = isNotEmptyString(movedTo) ? yield* repository.findRow(parentTable, movedTo, decoded.recordName) : null;

            if (!isNotEmptyString(movedTo) || !isDefined(movedParent)) {
                return unit;
            }

            const redirected = yield* redirectToZone(source, movedTo);

            return { ...unit, incoming: [redirected], sources: [redirected], decoded: redirected.decoded } satisfies SyncApplyUnitInterface;
        });

        const applyUnit = Effect.fn('SyncApplyUnitService.applyUnit')(function* (unit: SyncApplyUnitInterface) {
            const { decoded } = unit;
            const definition = SYNC_RECORD_DEFINITIONS[decoded.recordType];
            const parentTable = definition.parent.tableName;
            const parentDescriptor = definition.parent;
            const [parentRow] = decoded.rows;
            const parentKey = getSyncRowKey(parentTable, parentRow.syncId);
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

            const unitKeys = new Set(decoded.rows.map(row => getSyncRowKey(row.tableName, row.syncId)));
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

            if (isDefined(localParent)) {
                const parentLocalId = localParent.localRowId;
                const changedColumns = isDefined(outbox) ? readChangedColumns(outbox.changedColumns) : [];
                const baseRows = yield* loadBaseRows(unit);
                const localCells = toLocalCells(parentDescriptor, localParent);
                const baseParent = baseRows.get(parentKey);
                const baseCells = isDefined(baseParent) ? yield* toBaseCells(parentDescriptor, baseParent, unitIds) : null;
                const changedProperties = new Set(
                    parentDescriptor.columns
                        .filter(column => changedColumns.includes(getSyncColumnName(parentDescriptor, column.property)))
                        .map(column => column.property)
                );

                unitIds.set(parentKey, parentLocalId);

                if (decoded.recordType === SyncRecordTypeEnum.TRANSACTION) {
                    const entryAccountIds = yield* repository.findEntryAccountIds(parentLocalId);

                    accountIds.push(...entryAccountIds);
                }

                const serverParentCells = toServerCells(parentDescriptor, parentRow, resolutions, unitIds);
                const result = mergeSyncRow({
                    local: localCells,
                    base: baseCells,
                    server: serverParentCells,
                    localChanged: changedProperties,
                    authorship: SYNC_AUTHORSHIP_COLUMNS[parentTable] ?? null
                });
                const updates = diffSyncCells(parentDescriptor, result.merged, localCells);
                const kept = result.keptLocal.map(property => getSyncColumnName(parentDescriptor, property));

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
                        isGated: isDefined(outbox) && changedColumns.includes(tableName),
                        isParentTimingUnchanged: localCells['operatedAt'] === serverParentCells['operatedAt']
                    });

                    kept.push(...childResult.keptColumns);
                    isWritten ||= childResult.isWritten;

                    if (childResult.isWritten) {
                        touchedRows.push(
                            ...decoded.rows.filter(row => row.tableName === tableName).map(row => [tableName, row.syncId] as const)
                        );
                    }
                }

                keptColumns = isDefined(outbox) ? [...new Set(kept)].sort() : null;
            } else {
                for (const row of decoded.rows) {
                    yield* insertRowFor(row, resolutions, unitIds);
                    touchedRows.push([row.tableName, row.syncId]);
                }

                isWritten = true;
            }

            const localParentId = unitIds.get(parentKey);

            if (isDefined(localParentId)) {
                if (decoded.recordType === SyncRecordTypeEnum.TRANSACTION) {
                    const entryAccountIds = yield* repository.findEntryAccountIds(localParentId);

                    accountIds.push(...entryAccountIds);
                } else if (decoded.recordType === SyncRecordTypeEnum.ACCOUNT) {
                    accountIds.push(localParentId);
                }
            }

            if (decoded.recordType === SyncRecordTypeEnum.DEBT_EVENT) {
                accountIds.push(...[resolutions.get(parentRow)?.get('debtAccountId')].filter(isDefined));
            }

            return { missing: null, isWritten, touchedRows, accountIds, keptColumns } satisfies SyncUnitOutcomeInterface;
        });

        return { applyUnit, redirectMovedUnit };
    })
}) {
    static readonly layer = Layer.effect(SyncApplyUnitService, SyncApplyUnitService.make).pipe(
        Layer.provide([SyncApplyRepository.layer, SyncRecordRepository.layer, SyncEntryBaseValuationGuard.layer])
    );
}
