import { and, eq, inArray, ne } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { Db } from '../../../@generic/service/db.service';
import { SyncOutboxEntityTable } from '../../table/sync-outbox-entity.table';
import { SyncPendingEntityTable } from '../../table/sync-pending-entity.table';
import { SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE } from '../constant/sync-schema-paused.constant';

import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncFamilyRecordInterface } from '../interface/sync-family-record.interface';
import type { SyncLocalIdInterface } from '../interface/sync-local-id.interface';
import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncPausedZoneInterface } from '../interface/sync-paused-zone.interface';

const SAVEPOINT = 'sync_apply_unit';

export class SyncApplyRepository extends Context.Service<SyncApplyRepository>()('@budgie/contracts/SyncApplyRepository', {
    make: Effect.succeed({
        findRow: (tableName: string, syncZone: string, syncId: string) =>
            Db.query(db =>
                db.$client.unsafe<SyncLocalRowInterface>(
                    `SELECT rowid AS __localId, * FROM "${tableName}" WHERE sync_zone = ? AND sync_id = ? LIMIT 1`,
                    [syncZone, syncId]
                )
            ).pipe(Effect.map(rows => rows.at(0) ?? null)),
        findChildren: (tableName: string, parentColumn: string, parentLocalId: number) =>
            Db.query(db =>
                db.$client.unsafe<SyncLocalRowInterface>(`SELECT rowid AS __localId, * FROM "${tableName}" WHERE "${parentColumn}" = ?`, [
                    parentLocalId
                ])
            ),
        findLocalId: (tableName: string, preferredZone: string, syncId: string) =>
            Db.query(db =>
                db.$client.unsafe<SyncLocalIdInterface>(`SELECT rowid AS localId FROM "${tableName}" WHERE sync_zone = ? AND sync_id = ? LIMIT 1`, [
                    preferredZone,
                    syncId
                ])
            ).pipe(
                Effect.flatMap(rows =>
                    isNotEmptyArray(rows)
                        ? Effect.succeed(rows[0].localId)
                        : Db.query(db =>
                              db.$client.unsafe<SyncLocalIdInterface>(
                                  `SELECT rowid AS localId FROM "${tableName}" WHERE sync_id = ? ORDER BY rowid LIMIT 1`,
                                  [syncId]
                              )
                          ).pipe(Effect.map(fallbackRows => fallbackRows.at(0)?.localId ?? null))
                )
            ),
        findNaturalKeyId: (tableName: string, keyColumn: string, key: string) =>
            Db.query(db =>
                db.$client.unsafe<SyncLocalIdInterface>(`SELECT rowid AS localId FROM "${tableName}" WHERE "${keyColumn}" = ? ORDER BY rowid LIMIT 1`, [
                    key
                ])
            ).pipe(Effect.map(rows => rows.at(0)?.localId ?? null)),
        findEntryAccountIds: (transactionLocalId: number) =>
            Db.query(db =>
                db.$client.unsafe<{ readonly accountId: number }>(
                    `SELECT DISTINCT account_id AS accountId FROM transaction_entries WHERE transaction_id = ?`,
                    [transactionLocalId]
                )
            ).pipe(Effect.map(rows => rows.map(({ accountId }) => accountId))),
        insertRow: (tableName: string, columns: Readonly<Record<string, SyncCellType>>) => {
            const names = Object.keys(columns);

            return Db.mutation(
                { type: 'insert', tables: [tableName] },
                Db.query(db =>
                    db.$client.unsafe<SyncLocalIdInterface>(
                        `INSERT INTO "${tableName}" (${names.map(name => `"${name}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')}) RETURNING rowid AS localId`,
                        names.map(name => columns[name])
                    )
                )
            ).pipe(Effect.map(rows => rows[0].localId));
        },
        updateRow: (tableName: string, localId: number, columns: Readonly<Record<string, SyncCellType>>) => {
            const names = Object.keys(columns);

            return isEmptyArray(names)
                ? Effect.void
                : Db.mutation(
                      { type: 'update', tables: [tableName] },
                      Db.query(db =>
                          db.$client.unsafe(
                              `UPDATE "${tableName}" SET ${names.map(name => `"${name}" = ?`).join(', ')} WHERE rowid = ?`,
                              [...names.map(name => columns[name]), localId]
                          )
                      )
                  );
        },
        deleteRow: (tableName: string, localId: number) =>
            Db.mutation(
                { type: 'delete', tables: [tableName] },
                Db.query(db => db.$client.unsafe(`DELETE FROM "${tableName}" WHERE rowid = ?`, [localId]))
            ),
        refreshSearchTitle: (tableName: string, localId: number) =>
            Db.mutation(
                { type: 'update', tables: [tableName] },
                Db.query(db => db.$client.unsafe(`UPDATE "${tableName}" SET title_search = lower(title) WHERE rowid = ?`, [localId]))
            ),
        findFamilyRecords: (linkId: string) => {
            const pattern = `%"linkId":"${linkId}"%`;

            return Db.query(db =>
                db.$client.unsafe<SyncFamilyRecordInterface>(
                    `SELECT sync_zone AS syncZone, sync_id AS syncId, payload, system_fields AS systemFields, 0 AS isPending
                    FROM sync_record WHERE record_type IN ('Transaction', 'TransactionLeg') AND payload LIKE ?
                    UNION ALL
                    SELECT sync_zone, sync_id, payload, system_fields, 1
                    FROM sync_pending WHERE record_type IN ('Transaction', 'TransactionLeg') AND missing_record_type <> ? AND payload LIKE ?`,
                    [pattern, SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE, pattern]
                )
            );
        },
        findOutbox: (syncZone: string, syncId: string) =>
            Db.query(db => db.query.SyncOutboxEntityTable.findFirst({ where: { syncZone, syncId } })),
        removeOutbox: (syncZone: string, syncId: string) =>
            Db.query(db =>
                db
                    .delete(SyncOutboxEntityTable)
                    .where(and(eq(SyncOutboxEntityTable.syncZone, syncZone), eq(SyncOutboxEntityTable.syncId, syncId)))
            ),
        findPending: (syncZone: string, syncId: string) =>
            Db.query(db => db.query.SyncPendingEntityTable.findFirst({ where: { syncZone, syncId } })),
        findPendingWaitingFor: (missingSyncIds: readonly string[]) =>
            isEmptyArray(missingSyncIds)
                ? Effect.succeed([])
                : Db.query(db =>
                      db
                          .select()
                          .from(SyncPendingEntityTable)
                          .where(
                              and(
                                  inArray(SyncPendingEntityTable.missingSyncId, [...missingSyncIds]),
                                  ne(SyncPendingEntityTable.missingRecordType, SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE)
                              )
                          )
                          .orderBy(SyncPendingEntityTable.id)
                  ),
        findSchemaPaused: () =>
            Db.query(db =>
                db
                    .select()
                    .from(SyncPendingEntityTable)
                    .where(eq(SyncPendingEntityTable.missingRecordType, SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE))
                    .orderBy(SyncPendingEntityTable.id)
            ),
        countPending: () =>
            Db.query(db =>
                db.$client.unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM sync_pending WHERE missing_record_type <> ?`, [
                    SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE
                ])
            ).pipe(Effect.map(rows => rows[0].total)),
        findPausedZones: (supportedVersion: number) =>
            Db.query(db =>
                db.$client.unsafe<SyncPausedZoneInterface>(
                    `SELECT sync_zone AS syncZone, MAX(json_extract(payload, '$.schemaVersion')) AS requiredSchemaVersion
                    FROM sync_pending WHERE missing_record_type = ?
                    GROUP BY sync_zone HAVING MAX(json_extract(payload, '$.schemaVersion')) > ?
                    ORDER BY sync_zone`,
                    [SYNC_SCHEMA_PAUSED_MISSING_RECORD_TYPE, supportedVersion]
                )
            ),
        savepoint: () => Db.query(db => db.$client.unsafe(`SAVEPOINT ${SAVEPOINT}`)),
        releaseSavepoint: () => Db.query(db => db.$client.unsafe(`RELEASE ${SAVEPOINT}`)),
        rollbackSavepoint: () =>
            Db.query(db => db.$client.unsafe(`ROLLBACK TO ${SAVEPOINT}`)).pipe(
                Effect.andThen(Db.query(db => db.$client.unsafe(`RELEASE ${SAVEPOINT}`)))
            )
    })
}) {
    static readonly layer = Layer.effect(SyncApplyRepository, SyncApplyRepository.make);
}
