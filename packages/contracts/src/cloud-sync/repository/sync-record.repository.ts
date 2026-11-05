import { and, eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncRecordEntityTable } from '../table/sync-record-entity.table';

import type { SyncRecordCreateEntityInterface } from '../entity/sync-record-create-entity.interface';

export class SyncRecordRepository extends Context.Service<SyncRecordRepository>()('@budgie/contracts/SyncRecordRepository', {
    make: Effect.succeed({
        find: (syncZone: string, syncId: string) =>
            Db.query(db => db.query.SyncRecordEntityTable.findFirst({ where: { syncZone, syncId } })),
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
