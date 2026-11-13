import { SyncRecordRepository, TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Result from 'effect/Result';

import { isDefined, isEmptyArray, isNotEmptyArray, isNumber, isString } from '@rnw-community/shared';

import { SYNC_NATURAL_KEY_PROPERTIES } from '../../mapping/constant/sync-natural-key-properties.constant';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { joinSplitTransactions } from '../../mapping/utils/join-split-transactions.util';
import { SYNC_AUTHORSHIP_COLUMNS } from '../constant/sync-authorship-columns.constant';
import { SYNC_CHILD_NATURAL_KEYS } from '../constant/sync-child-natural-keys.constant';
import { SYNC_INSERT_PLACEHOLDERS } from '../constant/sync-insert-placeholders.constant';
import { SYNC_SEARCH_TITLE_TABLES, SYNC_TABLE_DESCRIPTORS } from '../constant/sync-table-descriptors.constant';
import { SyncApplyRepository } from '../repository/sync-apply.repository';
import { diffSyncCells } from '../utils/diff-sync-cells.util';
import { getSyncColumnName } from '../utils/get-sync-column-name.util';
import { getSyncRowKey } from '../utils/get-sync-row-key.util';
import { mergeSyncRow } from '../utils/merge-sync-row.util';
import { normalizeSyncCell } from '../utils/normalize-sync-cell.util';
import { readSyncReferenceId } from '../utils/read-sync-reference-id.util';
import { toLocalCells } from '../utils/to-local-cells.util';
import { toServerCells } from '../utils/to-server-cells.util';
import { toStoredSyncApplyItem } from '../utils/to-stored-sync-apply-item.util';

import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { ChildSyncContextInterface } from '../interface/child-sync-context.interface';
import type { SyncApplyItemInterface } from '../interface/sync-apply-item.interface';
import type { SyncApplyUnitInterface } from '../interface/sync-apply-unit.interface';
import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

const TRANSACTIONS_TABLE = 'transactions';

export class SyncChildApplyService extends Context.Service<SyncChildApplyService>()('@budgie/cloud-sync/SyncChildApplyService', {
    make: Effect.gen(function* () {
        const repository = yield* SyncApplyRepository;
        const recordRepository = yield* SyncRecordRepository;
        const transactionEntryBaseValuationRepository = yield* TransactionEntryBaseValuationRepository;
        const entriesTable = 'transaction_entries';
        const baseValuationProperties = ['baseInstrumentId', 'baseExchangeRate', 'baseAmount'];

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

        const identityOf = (localRow: SyncLocalRowInterface): string => `${String(localRow['sync_zone'])}|${String(localRow['sync_id'])}`;

        const passThrough = (_: Readonly<Record<string, SyncCellType>>, server: Readonly<Record<string, SyncCellType>>) => server;

        const buildBaseValuationGuard = Effect.fnUntraced(function* (
            tableName: string,
            localRows: readonly SyncLocalRowInterface[],
            isParentTimingUnchanged: boolean
        ) {
            const accountIds = localRows.map(row => row['account_id']).filter(isNumber);

            if (tableName !== entriesTable || !isParentTimingUnchanged || !isNotEmptyArray(accountIds)) {
                return passThrough;
            }

            const marketPricedAccountIdList = yield* transactionEntryBaseValuationRepository.findMarketPricedAccountIds(accountIds);
            const marketPricedAccountIds = new Set(marketPricedAccountIdList);

            return (local: Readonly<Record<string, SyncCellType>>, server: Readonly<Record<string, SyncCellType>>) => {
                const { accountId } = local;
                const isLedgerUnchanged =
                    isNumber(accountId) &&
                    marketPricedAccountIds.has(accountId) &&
                    server['accountId'] === accountId &&
                    server['amount'] === local['amount'];

                return isLedgerUnchanged
                    ? {
                          ...server,
                          ...Object.fromEntries(baseValuationProperties.map(property => [property, local[property] ?? null]))
                      }
                    : server;
            };
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

        const resolveReference = Effect.fn('SyncChildApplyService.resolveReference')(function* (
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

        const toBaseCells = Effect.fn('SyncChildApplyService.toBaseCells')(function* (
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

        const insertRow = Effect.fn('SyncChildApplyService.insertRow')(function* (
            row: SyncRowInterface,
            resolutions: SyncResolutionsType,
            unitIds: Map<string, number>
        ) {
            const descriptor = SYNC_TABLE_DESCRIPTORS[row.tableName];
            const columns = buildSyncInsertColumns(descriptor, row, resolutions, unitIds);
            const movedChild = isDefined(descriptor.parentLink) ? yield* repository.findRow(row.tableName, row.syncZone, row.syncId) : null;

            if (isDefined(movedChild)) {
                yield* repository.updateRow(row.tableName, movedChild.localRowId, columns);
                unitIds.set(getSyncRowKey(row.tableName, row.syncId), movedChild.localRowId);

                return movedChild.localRowId;
            }

            const localId = yield* repository.insertRow(row.tableName, columns);

            unitIds.set(getSyncRowKey(row.tableName, row.syncId), localId);

            if (SYNC_SEARCH_TITLE_TABLES.has(row.tableName)) {
                yield* repository.refreshSearchTitle(row.tableName, localId);
            }

            return localId;
        });

        const loadBaseRows = Effect.fn('SyncChildApplyService.loadBaseRows')(function* (unit: SyncApplyUnitInterface) {
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

        const syncChildTable = Effect.fn('SyncChildApplyService.syncChildTable')(function* (
            unit: SyncApplyUnitInterface,
            tableName: string,
            parentLocalId: number,
            context: ChildSyncContextInterface
        ) {
            const { resolutions, unitIds, baseRows, isGated, isParentTimingUnchanged } = context;
            const descriptor = SYNC_TABLE_DESCRIPTORS[tableName];
            const parentProperty = descriptor.parentLink?.property ?? '';
            const serverRows = unit.decoded.rows.filter(row => row.tableName === tableName);
            const localRows = yield* repository.findChildren(tableName, getSyncColumnName(descriptor, parentProperty), parentLocalId);
            const guardBaseValuation = yield* buildBaseValuationGuard(tableName, localRows, isParentTimingUnchanged);
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
                    yield* insertRow(serverRow, resolutions, unitIds);
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

        return { resolveReference, loadBaseRows, toBaseCells, insertRow, syncChildTable };
    })
}) {
    static readonly layer = Layer.effect(SyncChildApplyService, SyncChildApplyService.make).pipe(
        Layer.provide([SyncApplyRepository.layer, SyncRecordRepository.layer, TransactionEntryBaseValuationRepository.layer])
    );
}
