import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { MccGroupCreateEntityInterface } from '../entity/mcc-group-create-entity.interface';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class MccGroupRepository {
    readonly create = Effect.fn('MccGroupRepository.create')(function* (this: MccGroupRepository, input: MccGroupCreateEntityInterface) {
        const [mccGroup] = yield* this.bulkCreate([input]);

        return mccGroup;
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    readonly bulkCreate = (inputs: MccGroupCreateEntityInterface[]) =>
        Db.query(db => db.insert(MccGroupEntityTable).values(inputs).returning());

    readonly upsert = (input: MccGroupCreateEntityInterface) =>
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
        ).pipe(Effect.map(([mccGroup]) => mccGroup));

    readonly truncate = () => Db.query(db => db.delete(MccGroupEntityTable));

    findAll() {
        return this.db.query.MccGroupEntityTable.findMany();
    }

    findByType(type: string) {
        return this.db.query.MccGroupEntityTable.findFirst({
            where: eq(MccGroupEntityTable.type, type)
        });
    }
}
