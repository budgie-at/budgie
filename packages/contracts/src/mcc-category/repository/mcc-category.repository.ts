import { eq, inArray } from 'drizzle-orm';

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

    findByMcc(mcc: string) {
        return this.db.query.MccCategoryEntityTable.findFirst({
            where: eq(MccCategoryEntityTable.mcc, mcc)
        });
    }

    findByMccs(mccs: string[]) {
        return this.db.query.MccCategoryEntityTable.findMany({
            where: inArray(MccCategoryEntityTable.mcc, mccs)
        });
    }

    findByMccGroupId(mccGroupId: number) {
        return this.db.query.MccCategoryEntityTable.findMany({
            where: eq(MccCategoryEntityTable.mccGroupId, mccGroupId)
        });
    }

    async create(input: MccCategoryCreateEntityInterface, tx?: TX): Promise<MccCategoryEntityInterface> {
        const [mccCategory] = await this.bulkCreate([input], tx);

        return mccCategory;
    }

    async bulkCreate(inputs: MccCategoryCreateEntityInterface[], tx?: TX): Promise<MccCategoryEntityInterface[]> {
        return await (tx ?? this.db).insert(MccCategoryEntityTable).values(inputs).returning();
    }

    async upsert(input: MccCategoryCreateEntityInterface, tx?: TX): Promise<MccCategoryEntityInterface> {
        const [mccCategory] = await (tx ?? this.db)
            .insert(MccCategoryEntityTable)
            .values(input)
            .onConflictDoUpdate({
                target: MccCategoryEntityTable.mcc,
                set: {
                    mccGroupId: input.mccGroupId,
                    shortDescription: input.shortDescription,
                    fullDescription: input.fullDescription
                }
            })
            .returning();

        return mccCategory;
    }

    async bulkUpsert(inputs: MccCategoryCreateEntityInterface[], tx?: TX): Promise<void> {
        for (const input of inputs) {
            // eslint-disable-next-line no-await-in-loop
            await this.upsert(input, tx);
        }
    }

    async deleteByMcc(mcc: string): Promise<void> {
        await this.db.delete(MccCategoryEntityTable).where(eq(MccCategoryEntityTable.mcc, mcc));
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(MccCategoryEntityTable);
    }
}
