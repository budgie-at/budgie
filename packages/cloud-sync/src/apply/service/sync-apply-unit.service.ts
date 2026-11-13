import {
    SyncOutboxOperationEnum,
    SyncRecordRepository,
    SyncRecordTypeEnum,
    TransactionTypeEnum,
    TransactionYieldRepository,
    YieldKindEnum,
    normalizeYieldFields
} from '@budgie/contracts';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { SYNC_AUTHORSHIP_COLUMNS } from '../constant/sync-authorship-columns.constant';
import { SYNC_SEARCH_TITLE_TABLES, SYNC_TABLE_DESCRIPTORS } from '../constant/sync-table-descriptors.constant';
import { SyncApplyRepository } from '../repository/sync-apply.repository';
import { diffSyncCells } from '../utils/diff-sync-cells.util';
import { getSyncColumnName } from '../utils/get-sync-column-name.util';
import { getSyncRowKey } from '../utils/get-sync-row-key.util';
import { mergeSyncRow } from '../utils/merge-sync-row.util';
import { readStoredMovedTo } from '../utils/read-stored-moved-to.util';
import { stringifySyncJson } from '../utils/stringify-sync-json.util';
import { toLocalCells } from '../utils/to-local-cells.util';
import { toServerCells } from '../utils/to-server-cells.util';

import { SyncChildApplyService } from './sync-child-apply.service';

import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';
import type { SyncApplyUnitInterface } from '../interface/sync-apply-unit.interface';
import type { SyncPreResolutionInterface } from '../interface/sync-pre-resolution.interface';
import type { SyncUnitOutcomeInterface } from '../interface/sync-unit-outcome.interface';
import type { SyncCellType } from '../type/sync-cell.type';

export class SyncApplyUnitService extends Context.Service<SyncApplyUnitService>()('@budgie/cloud-sync/SyncApplyUnitService', {
    make: Effect.gen(function* () {
        const repository = yield* SyncApplyRepository;
        const recordRepository = yield* SyncRecordRepository;
        const childApplyService = yield* SyncChildApplyService;
        const yieldRepository = yield* TransactionYieldRepository;

        const jsonRecord = Schema.Record(Schema.String, Schema.Unknown).pipe(Schema.fromJsonString);
        const columnListSchema = Schema.String.pipe(Schema.Array, Schema.fromJsonString);

        const yieldKindProperty = 'yieldKind';
        const yieldSourceProperty = 'yieldSourceAccountId';
        const isTransactionType = Schema.is(Schema.Enum(TransactionTypeEnum));
        const isYieldKind = Schema.is(Schema.Enum(YieldKindEnum));

        const normalizeIncomingTransactionRow = (row: SyncRowInterface): SyncRowInterface => {
            const { type, yieldKind } = row.values;
            const sourceReference = row.references.find(reference => reference.column === yieldSourceProperty) ?? null;
            const normalized = normalizeYieldFields(
                isTransactionType(type) ? type : TransactionTypeEnum.TRANSFER,
                isYieldKind(yieldKind) ? yieldKind : null,
                sourceReference
            );

            return {
                ...row,
                values: { ...row.values, [yieldKindProperty]: normalized.yieldKind },
                references: row.references.filter(
                    reference => reference.column !== yieldSourceProperty || reference === normalized.yieldSourceAccountId
                )
            };
        };

        const normalizeIncomingYield = (decoded: SyncApplyUnitInterface['decoded']): SyncApplyUnitInterface['decoded'] =>
            decoded.recordType === SyncRecordTypeEnum.TRANSACTION
                ? {
                      ...decoded,
                      rows: decoded.rows.map(row => (row.tableName === 'transactions' ? normalizeIncomingTransactionRow(row) : row))
                  }
                : decoded;

        const keepLocalYieldCells = Effect.fnUntraced(function* (
            server: Readonly<Record<string, SyncCellType>>,
            local: Readonly<Record<string, SyncCellType>>,
            landingAccountId: number | undefined
        ) {
            const { type, yieldKind: serverKind, yieldSourceAccountId: serverSource } = server;

            if (!isTransactionType(type)) {
                return server;
            }

            const { yieldKind: localKind, yieldSourceAccountId: localSource } = local;
            const storedKind = isYieldKind(localKind) ? localKind : null;
            const incomingSource = isNumber(serverSource) ? serverSource : null;
            const storedSource = isNumber(localSource) ? localSource : null;
            const isStoredSourceKept =
                !isDefined(incomingSource) &&
                isDefined(storedSource) &&
                isDefined(landingAccountId) &&
                (yield* yieldRepository.areAccountsInSameZone(storedSource, landingAccountId));

            return {
                ...server,
                ...normalizeYieldFields(
                    type,
                    isYieldKind(serverKind) ? serverKind : storedKind,
                    isStoredSourceKept ? storedSource : incomingSource
                )
            };
        });

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

        const preResolve = Effect.fnUntraced(function* (rows: readonly SyncRowInterface[], unitKeys: ReadonlySet<string>) {
            const resolutions = new Map<SyncRowInterface, ReadonlyMap<string, number>>();

            for (const row of rows) {
                const rowResolutions = new Map<string, number>();

                for (const reference of row.references) {
                    const isInUnit =
                        reference.kind === SyncReferenceKindEnum.SYNC_ID && unitKeys.has(getSyncRowKey(reference.tableName, reference.key));

                    if (!isInUnit) {
                        const localId = yield* childApplyService.resolveReference(reference, row.syncZone, new Map());

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
                const descriptor = SYNC_TABLE_DESCRIPTORS[tableName];
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
                ? Arr.filter(unit.sources, ({ decoded }) => decoded.recordType === SyncRecordTypeEnum.TRANSACTION_LEG)
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
            const decoded = normalizeIncomingYield(unit.decoded);
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
                const baseRows = yield* childApplyService.loadBaseRows(unit);
                const localCells = toLocalCells(parentDescriptor, localParent);
                const baseParent = baseRows.get(parentKey);
                const baseCells = isDefined(baseParent)
                    ? yield* childApplyService.toBaseCells(parentDescriptor, baseParent, unitIds)
                    : null;
                const changedProperties = new Set(
                    parentDescriptor.columns
                        .filter(column => changedColumns.includes(getSyncColumnName(parentDescriptor, column.property)))
                        .map(column => column.property)
                );

                unitIds.set(parentKey, parentLocalId);

                const entryAccountIds =
                    decoded.recordType === SyncRecordTypeEnum.TRANSACTION ? yield* repository.findEntryAccountIds(parentLocalId) : [];

                accountIds.push(...entryAccountIds);

                const incomingParentCells = toServerCells(parentDescriptor, parentRow, resolutions, unitIds);
                const serverParentCells =
                    decoded.recordType === SyncRecordTypeEnum.TRANSACTION
                        ? yield* keepLocalYieldCells(incomingParentCells, localCells, entryAccountIds.at(0))
                        : incomingParentCells;
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
                    yield* SYNC_SEARCH_TITLE_TABLES.has(parentTable)
                        ? repository.refreshSearchTitle(parentTable, parentLocalId)
                        : Effect.void;
                    isWritten = true;
                }

                touchedRows.push([parentTable, parentRow.syncId]);

                for (const tableName of new Set(definition.children.map(child => child.descriptor.tableName))) {
                    const childResult = yield* childApplyService.syncChildTable(unit, tableName, parentLocalId, {
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
                    yield* childApplyService.insertRow(row, resolutions, unitIds);
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
        Layer.provide([
            SyncApplyRepository.layer,
            SyncRecordRepository.layer,
            SyncChildApplyService.layer,
            TransactionYieldRepository.layer
        ])
    );
}
