import { and, count, eq, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SYNC_RECORD_DEFINITIONS } from '../mapping/constant/sync-record-definitions.constant';
import { SyncRecordTypeEnum } from '../mapping/enum/sync-record-type.enum';
import { SyncOutboxEntityTable } from '../table/sync-outbox-entity.table';

import type { SyncOutboxCreateEntityInterface } from '../entity/sync-outbox-create-entity.interface';

export class SyncOutboxRepository extends Context.Service<SyncOutboxRepository>()('@budgie/contracts/SyncOutboxRepository', {
    make: Effect.sync(() => {
        const enqueueRows = Effect.fnUntraced(function* (syncZone: string, isUnrecordedOnly: boolean) {
            const definitions = Object.values(SYNC_RECORD_DEFINITIONS).filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG);

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
        });

        return {
        enqueue: (input: Pick<SyncOutboxCreateEntityInterface, 'recordType' | 'syncZone' | 'syncId' | 'operation' | 'changedColumns'>) =>
            Db.query(db =>
                db
                    .insert(SyncOutboxEntityTable)
                    .values(input)
                    .onConflictDoUpdate({
                        target: [SyncOutboxEntityTable.syncZone, SyncOutboxEntityTable.syncId],
                        set: {
                            operation: input.operation,
                            changedColumns: input.changedColumns,
                            syncRevision: sql`${SyncOutboxEntityTable.syncRevision} + 1`
                        }
                    })
            ),
        findPending: (limit: number) => Db.query(db => db.query.SyncOutboxEntityTable.findMany({ orderBy: { id: 'asc' }, limit })),
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
        countPending: () => Db.query(db => db.select({ total: count() }).from(SyncOutboxEntityTable)).pipe(Effect.map(([row]) => row.total))
        };
    })
}) {
    static readonly layer = Layer.effect(SyncOutboxRepository, SyncOutboxRepository.make);
}
