import { and, eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncRecordEntityTable } from '../table/sync-record-entity.table';

import type { SyncRecordCreateEntityInterface } from '../entity/sync-record-create-entity.interface';
import type { SyncRecordEntityInterface } from '../entity/sync-record-entity.interface';

export class SyncRecordRepository extends Context.Service<SyncRecordRepository>()('@budgie/contracts/SyncRecordRepository', {
    make: Effect.succeed({
        find: (syncZone: string, syncId: string) =>
            Db.query(db => db.query.SyncRecordEntityTable.findFirst({ where: { syncZone, syncId } })),
        findByRecordType: (recordType: string) => Db.query(db => db.query.SyncRecordEntityTable.findMany({ where: { recordType } })),
        findBySyncId: (syncId: string) => Db.query(db => db.query.SyncRecordEntityTable.findMany({ where: { syncId } })),
        upsert: (input: SyncRecordCreateEntityInterface) =>
            Db.query(db =>
                db
                    .insert(SyncRecordEntityTable)
                    .values(input)
                    .onConflictDoUpdate({
                        target: [SyncRecordEntityTable.syncZone, SyncRecordEntityTable.syncId],
                        set: {
                            recordType: input.recordType,
                            systemFields: input.systemFields ?? null,
                            payload: input.payload ?? null,
                            schemaVersion: input.schemaVersion ?? 1,
                            updatedAt: new Date()
                        }
                    })
            ),
        invalidateAll: Db.query(db => db.update(SyncRecordEntityTable).set({ systemFields: null, payload: null, updatedAt: new Date(0) })),
        findUnconfirmed: Db.query(db =>
            db.$client.unsafe<Pick<SyncRecordEntityInterface, 'syncZone' | 'syncId' | 'recordType'>>(
                `SELECT sync_zone AS syncZone, sync_id AS syncId, record_type AS recordType FROM sync_record
                    WHERE updated_at = 0
                    AND NOT EXISTS (SELECT 1 FROM sync_pending WHERE sync_pending.sync_zone = sync_record.sync_zone AND sync_pending.sync_id = sync_record.sync_id)`
            )
        ),
        remove: (syncZone: string, syncId: string) =>
            Db.query(db =>
                db
                    .delete(SyncRecordEntityTable)
                    .where(and(eq(SyncRecordEntityTable.syncZone, syncZone), eq(SyncRecordEntityTable.syncId, syncId)))
            )
    })
}) {
    static readonly layer = Layer.effect(SyncRecordRepository, SyncRecordRepository.make);
}
