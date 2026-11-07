import { MOVED_TO_TOMBSTONE_SQL, PERSONAL_SYNC_ZONE, Db, SyncRecordTypeEnum, SyncOutboxEntityTable } from '@budgie/contracts';
import { and, count, eq, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SYNC_MOVED_TO_MARKER_PREFIX } from '../../share/constant/sync-move-markers.constant';

import type { SyncOutboxCreateEntityInterface } from '@budgie/contracts';

export class SyncOutboxRepository extends Context.Service<SyncOutboxRepository>()('@budgie/cloud-sync/SyncOutboxRepository', {
    make: Effect.sync(() => {
        const enqueueRows = Effect.fnUntraced(function* (syncZone: string, isUnrecordedOnly: boolean) {
            const definitions = Object.values(SYNC_RECORD_DEFINITIONS).filter(
                ({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG
            );

            yield* Db.mutation(
                { type: 'insert', tables: ['sync_outbox'] },
                Effect.forEach(
                    definitions,
                    definition => {
                        const { tableName } = definition.parent;
                        const unrecordedCondition = isUnrecordedOnly
                            ? `AND NOT EXISTS (SELECT 1 FROM sync_record WHERE sync_record.sync_zone = ${tableName}.sync_zone AND sync_record.sync_id = ${tableName}.sync_id)`
                            : '';

                        return Db.query(db =>
                            db.$client.unsafe(
                                `INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
                                SELECT ?, sync_zone, sync_id, 'SAVE', '[]' FROM ${tableName}
                                WHERE sync_id IS NOT NULL AND sync_zone = ? ${unrecordedCondition}
                                ON CONFLICT (sync_zone, sync_id) DO NOTHING`,
                                [definition.recordType, syncZone]
                            )
                        );
                    },
                    { discard: true }
                )
            );
            if (syncZone === PERSONAL_SYNC_ZONE) {
                yield* Db.mutation(
                    { type: 'insert', tables: ['sync_outbox'] },
                    Db.query(db =>
                        db.$client.unsafe(
                            `INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
                 SELECT record_type, sync_zone, sync_id, 'DELETE', json_array(? || json_extract(payload, '$.encryptedFields.movedTo'))
                 FROM sync_record WHERE ${MOVED_TO_TOMBSTONE_SQL}
                 ON CONFLICT (sync_zone, sync_id) DO NOTHING`,
                            [SYNC_MOVED_TO_MARKER_PREFIX, PERSONAL_SYNC_ZONE, SyncRecordTypeEnum.ACCOUNT]
                        )
                    )
                );
            }
        });

        return {
            enqueue: (
                input: Pick<SyncOutboxCreateEntityInterface, 'recordType' | 'syncZone' | 'syncId' | 'operation' | 'changedColumns'>
            ) =>
                Db.query(db =>
                    db
                        .insert(SyncOutboxEntityTable)
                        .values(input)
                        .onConflictDoUpdate({
                            target: [SyncOutboxEntityTable.syncZone, SyncOutboxEntityTable.syncId],
                            set: {
                                operation: input.operation,
                                changedColumns: sql`CASE WHEN excluded.operation = 'DELETE' OR ${SyncOutboxEntityTable.operation} = 'DELETE' THEN excluded.changed_columns ELSE (SELECT json_group_array(value) FROM (SELECT value FROM json_each(${SyncOutboxEntityTable.changedColumns}) UNION SELECT value FROM json_each(excluded.changed_columns) ORDER BY value)) END`,
                                syncRevision: sql`${SyncOutboxEntityTable.syncRevision} + 1`
                            }
                        })
                ),
            replaceChangedColumns: (syncZone: string, syncId: string, changedColumns: string) =>
                Db.query(db =>
                    db
                        .update(SyncOutboxEntityTable)
                        .set({ changedColumns, syncRevision: sql`${SyncOutboxEntityTable.syncRevision} + 1` })
                        .where(and(eq(SyncOutboxEntityTable.syncZone, syncZone), eq(SyncOutboxEntityTable.syncId, syncId)))
                ),
            findPending: (limit: number, sendableZones: readonly string[]) =>
                Db.query(db =>
                    db.query.SyncOutboxEntityTable.findMany({
                        where: { syncZone: { in: [...sendableZones] } },
                        orderBy: { id: 'asc' },
                        limit
                    })
                ),
            acknowledge: (syncZone: string, syncId: string, syncRevision: number) =>
                Db.query(db =>
                    db
                        .delete(SyncOutboxEntityTable)
                        .where(
                            and(
                                eq(SyncOutboxEntityTable.syncZone, syncZone),
                                eq(SyncOutboxEntityTable.syncId, syncId),
                                eq(SyncOutboxEntityTable.syncRevision, syncRevision)
                            )
                        )
                ),
            enqueueAll: (syncZone: string) => enqueueRows(syncZone, false),
            enqueueUnrecorded: (syncZone: string) => enqueueRows(syncZone, true),
            countPending: Db.query(db => db.select({ total: count() }).from(SyncOutboxEntityTable)).pipe(Effect.map(([row]) => row.total))
        };
    })
}) {
    static readonly layer = Layer.effect(SyncOutboxRepository, SyncOutboxRepository.make);
}
