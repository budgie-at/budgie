import { eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { MccGroupCreateEntityInterface } from '../entity/mcc-group-create-entity.interface';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

export class MccGroupRepository extends Context.Service<MccGroupRepository>()('@budgie/contracts/MccGroupRepository', {
    make: Effect.sync(() => {
        const bulkCreate = (inputs: MccGroupCreateEntityInterface[]) =>
            Db.query(db => db.insert(MccGroupEntityTable).values(inputs).returning());

        return {
            bulkCreate,
            create: Effect.fn('MccGroupRepository.create')(function* (input: MccGroupCreateEntityInterface) {
                const [mccGroup] = yield* bulkCreate([input]);

                return mccGroup;
            }),
            upsert: (input: MccGroupCreateEntityInterface) =>
                Db.query(db =>
                    db
                        .insert(MccGroupEntityTable)
                        .values(input)
                        .onConflictDoUpdate({
                            target: MccGroupEntityTable.type,
                            set: {
                                description: input.description
                            }
                        })
                        .returning()
                ).pipe(Effect.map(([mccGroup]) => mccGroup)),
            truncate: () => Db.query(db => db.delete(MccGroupEntityTable)),
            findAll: () => Db.query(db => db.query.MccGroupEntityTable.findMany()),
            findByType: (type: string) =>
                Db.query(db => db.query.MccGroupEntityTable.findFirst({ where: eq(MccGroupEntityTable.type, type) }))
        };
    })
}) {
    static readonly layer = Layer.effect(MccGroupRepository, MccGroupRepository.make);
}
