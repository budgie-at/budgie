import { eq } from 'drizzle-orm';

import { DB } from '../../@generic/type/db.type';
import { MccCategoryCreateEntityInterface } from '../entity/mcc-category-create-entity.interface';
import { MccCategoryEntityInterface } from '../entity/mcc-category-entity.interface';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

export class MccCategoryRepository {
    constructor(private db: DB) {}

    findAll() {
        return this.db.query.MccCategoryEntityTable.findMany();
    }

    findById(id: number) {
        return this.db.query.MccCategoryEntityTable.findFirst({
            where: eq(MccCategoryEntityTable.id, id)
        });
    }

    async create(input: MccCategoryCreateEntityInterface, tx?: DB): Promise<MccCategoryEntityInterface> {
        const [mccCategory] = await this.bulkCreate([input], tx);

        return mccCategory;
    }

    async bulkCreate(inputs: MccCategoryCreateEntityInterface[], tx?: DB): Promise<MccCategoryEntityInterface[]> {
        return await (tx ?? this.db).insert(MccCategoryEntityTable).values(inputs).returning();
    }

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(MccCategoryEntityTable);
    }
}
