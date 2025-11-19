import { and, eq, sql } from 'drizzle-orm';

import * as schema from '../../schema';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type { CategoryEntityInterface } from '../entity/category-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class CategoryRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findBySearchQuery(search: string, includeDefault: boolean) {
        const searchQuery = sql`LOWER (${CategoryEntityTable.title}) LIKE ${`%${search.toLowerCase()}%`}`;

        return this.db.query.CategoryEntityTable.findMany({
            where: includeDefault ? searchQuery : and(searchQuery, eq(CategoryEntityTable.isDefault, false))
        });
    }

    findUserCategories(): Promise<CategoryEntityInterface | undefined> {
        return this.db.query.CategoryEntityTable.findFirst({ where: eq(CategoryEntityTable.isDefault, false) });
    }

    async create(input: CategoryCreateEntityInterface): Promise<CategoryEntityInterface> {
        const [category] = await this.db.insert(CategoryEntityTable).values([input]).returning();

        return category;
    }

    async updateById(id: number, input: CategoryUpdateEntityInterface): Promise<CategoryEntityInterface> {
        const [category] = await this.db.update(CategoryEntityTable).set(input).where(eq(CategoryEntityTable.id, id)).returning();

        return category;
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(CategoryEntityTable).where(eq(CategoryEntityTable.id, id));
    }
}
