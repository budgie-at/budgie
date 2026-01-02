import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { MccCategoryCreateEntityInterface } from '../entity/mcc-category-create-entity.interface';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

import type { MccCategoryEntityInterface } from '../entity/mcc-category-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class MccCategoryRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.MccCategoryEntityTable.findMany();
    }

    async create(input: MccCategoryCreateEntityInterface, tx?: TX): Promise<MccCategoryEntityInterface> {
        const [mccCategory] = await this.bulkCreate([input], tx);

        return mccCategory;
    }

    async bulkCreate(inputs: MccCategoryCreateEntityInterface[], tx?: TX): Promise<MccCategoryEntityInterface[]> {
        return await (tx ?? this.db).insert(MccCategoryEntityTable).values(inputs).returning();
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(MccCategoryEntityTable);
    }
}
