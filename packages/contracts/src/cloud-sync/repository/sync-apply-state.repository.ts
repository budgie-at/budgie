import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncApplyStateEntityTable } from '../table/sync-apply-state-entity.table';

export class SyncApplyStateRepository extends Context.Service<SyncApplyStateRepository>()('@budgie/contracts/SyncApplyStateRepository', {
    make: Effect.succeed({
        isApplying: Db.query(db => db.query.SyncApplyStateEntityTable.findFirst()).pipe(Effect.map(state => state?.isApplying ?? false)),
        setApplying: (isApplying: boolean) =>
            Db.query(db =>
                db
                    .insert(SyncApplyStateEntityTable)
                    .values({ id: 1, isApplying })
                    .onConflictDoUpdate({ target: SyncApplyStateEntityTable.id, set: { isApplying } })
            )
    })
}) {
    static readonly layer = Layer.effect(SyncApplyStateRepository, SyncApplyStateRepository.make);
}
