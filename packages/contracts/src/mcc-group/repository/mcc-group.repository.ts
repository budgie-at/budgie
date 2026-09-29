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

    readonly bulkCreate = Effect.fn('MccGroupRepository.bulkCreate')(function* (inputs: MccGroupCreateEntityInterface[]) {
        return yield* Db.query(db => db.insert(MccGroupEntityTable).values(inputs).returning());
    });

    readonly upsert = Effect.fn('MccGroupRepository.upsert')(function* (input: MccGroupCreateEntityInterface) {
        const [mccGroup] = yield* Db.query(db =>
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
        );

        return mccGroup;
    });

    readonly deleteByType = Effect.fn('MccGroupRepository.deleteByType')(function* (type: string) {
        yield* Db.query(db => db.delete(MccGroupEntityTable).where(eq(MccGroupEntityTable.type, type)));
    });

    readonly truncate = Effect.fn('MccGroupRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(MccGroupEntityTable));
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.MccGroupEntityTable.findMany();
    }

    findByType(type: string) {
        return this.db.query.MccGroupEntityTable.findFirst({
            where: eq(MccGroupEntityTable.type, type)
        });
    }
}
