import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncApplyStateEntityTable } from '../table/sync-apply-state-entity.table';

export class SyncApplyStateRepository extends Context.Service<SyncApplyStateRepository>()('@budgie/contracts/SyncApplyStateRepository', {
    make: Effect.sync(() => {
        const setApplying = (isApplying: boolean) =>
            Db.query(db =>
                db
                    .insert(SyncApplyStateEntityTable)
                    .values({ id: 1, isApplying })
                    .onConflictDoUpdate({ target: SyncApplyStateEntityTable.id, set: { isApplying } })
            );

        return {
            withoutTriggers: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
                Db.transaction(setApplying(true).pipe(Effect.andThen(effect), Effect.ensuring(Effect.orDie(setApplying(false)))))
        };
    })
}) {
    static readonly layer = Layer.effect(SyncApplyStateRepository, SyncApplyStateRepository.make);
}
