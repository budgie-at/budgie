import { and, eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncPendingEntityTable } from '../table/sync-pending-entity.table';

import type { SyncPendingCreateEntityInterface } from '../entity/sync-pending-create-entity.interface';

export class SyncPendingRepository extends Context.Service<SyncPendingRepository>()('@budgie/contracts/SyncPendingRepository', {
    make: Effect.succeed({
        add: (input: SyncPendingCreateEntityInterface) =>
            Db.query(db =>
                db
                    .insert(SyncPendingEntityTable)
                    .values(input)
                    .onConflictDoUpdate({
                        target: [SyncPendingEntityTable.syncZone, SyncPendingEntityTable.syncId],
                        set: {
                            recordType: input.recordType,
                            missingRecordType: input.missingRecordType,
                            missingSyncId: input.missingSyncId,
                            systemFields: input.systemFields ?? null,
                            payload: input.payload
                        }
                    })
            ),
        findWaitingFor: (syncZone: string, missingSyncId: string) =>
            Db.query(db => db.query.SyncPendingEntityTable.findMany({ where: { syncZone, missingSyncId }, orderBy: { id: 'asc' } })),
        remove: (syncZone: string, syncId: string) =>
            Db.query(db =>
                db
                    .delete(SyncPendingEntityTable)
                    .where(and(eq(SyncPendingEntityTable.syncZone, syncZone), eq(SyncPendingEntityTable.syncId, syncId)))
            )
    })
}) {
    static readonly layer = Layer.effect(SyncPendingRepository, SyncPendingRepository.make);
}
