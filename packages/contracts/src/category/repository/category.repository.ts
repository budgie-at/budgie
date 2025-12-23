import { and, count, eq, sql } from 'drizzle-orm';

import { TX } from '../../generic/type/db.type';
import * as schema from '../../schema';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type { CategoryEntityInterface } from '../entity/category-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class CategoryRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.CategoryEntityTable.findMany();
    }

    findBySearchQuery(search: string, includeDefault: boolean) {
        const searchQuery = sql`LOWER (${CategoryEntityTable.title}) LIKE ${`%${search.toLowerCase()}%`}`;

        return this.db.query.CategoryEntityTable.findMany({
            where: includeDefault
                ? and(searchQuery, eq(CategoryEntityTable.isSystemCategory, false))
                : and(searchQuery, eq(CategoryEntityTable.isDefault, false), eq(CategoryEntityTable.isSystemCategory, false))
        });
    }

    count(includeDefault: boolean) {
        if (includeDefault) {
            return this.db.select({ count: count() }).from(CategoryEntityTable);
        }

        return this.db.select({ count: count() }).from(CategoryEntityTable).where(eq(CategoryEntityTable.isDefault, false));
    }

    async create(input: CategoryCreateEntityInterface, tx?: TX): Promise<CategoryEntityInterface> {
        const [category] = await this.bulkCreate([input], tx);

        return category;
    }

    async bulkCreate(inputs: CategoryCreateEntityInterface[], tx?: TX): Promise<CategoryEntityInterface[]> {
        return await (tx ?? this.db).insert(CategoryEntityTable).values(inputs).returning();
    }

    async updateById(id: number, input: CategoryUpdateEntityInterface): Promise<CategoryEntityInterface> {
        const [category] = await this.db.update(CategoryEntityTable).set(input).where(eq(CategoryEntityTable.id, id)).returning();

        return category;
    }

    findById(id: number) {
        return this.db.query.CategoryEntityTable.findFirst({
            where: eq(CategoryEntityTable.id, id)
        });
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(CategoryEntityTable).where(eq(CategoryEntityTable.id, id));
    }

    async truncate(includeDefault: boolean): Promise<void> {
        await this.db
            .delete(CategoryEntityTable)
            .where(includeDefault ? eq(CategoryEntityTable.isSystemCategory, false) : eq(CategoryEntityTable.isDefault, false));
    }
}
