import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../@generic/service/db.service';
import { MccCategoryCreateEntityInterface } from '../entity/mcc-category-create-entity.interface';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class MccCategoryRepository {
    readonly create = Effect.fn('MccCategoryRepository.create')(function* (
        this: MccCategoryRepository,
        input: MccCategoryCreateEntityInterface
    ) {
        const [mccCategory] = yield* this.bulkCreate([input]);

        return mccCategory;
    });

    readonly bulkCreate = Effect.fn('MccCategoryRepository.bulkCreate')(function* (inputs: MccCategoryCreateEntityInterface[]) {
        return yield* Db.query(db => db.insert(MccCategoryEntityTable).values(inputs).returning());
    });

    readonly truncate = Effect.fn('MccCategoryRepository.truncate')(function* () {
        yield* Db.query(db => db.delete(MccCategoryEntityTable));
    });

    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.MccCategoryEntityTable.findMany();
    }

    findById(id: number) {
        return this.db.query.MccCategoryEntityTable.findFirst({
            where: eq(MccCategoryEntityTable.id, id)
        });
    }
}
