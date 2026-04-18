import { and, count, eq, getTableColumns, isNull, like, sql } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type * as schema from '../../schema';
import type { CategoryEntityInterface } from '../entity/category-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class CategoryRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.CategoryEntityTable.findMany();
    }

    findBySearchQuery(search: string, includeDefault: boolean) {
        const searchQuery = like(CategoryEntityTable.titleSearch, `%${search.toLowerCase()}%`);

        const whereConditions = includeDefault
            ? and(searchQuery, eq(CategoryEntityTable.isSystemCategory, false))
            : and(searchQuery, eq(CategoryEntityTable.isDefault, false), eq(CategoryEntityTable.isSystemCategory, false));

        return this.db
            .select(getTableColumns(CategoryEntityTable))
            .from(CategoryEntityTable)
            .leftJoin(TransactionEntryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .where(whereConditions)
            .groupBy(CategoryEntityTable.id)
            .orderBy(sql`COUNT(${TransactionEntryEntityTable.id}) DESC`);
    }

    count(includeDefault: boolean) {
        if (includeDefault) {
            return this.db.select({ count: count() }).from(CategoryEntityTable);
        }

        return this.db.select({ count: count() }).from(CategoryEntityTable).where(eq(CategoryEntityTable.isDefault, false));
    }

    async create(input: CategoryCreateEntityInterface, tx?: DB): Promise<CategoryEntityInterface> {
        const [category] = await this.bulkCreate([input], tx);

        return category;
    }

    async bulkCreate(inputs: CategoryCreateEntityInterface[], tx?: DB): Promise<CategoryEntityInterface[]> {
        return await (tx ?? this.db)
            .insert(CategoryEntityTable)
            .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
            .returning();
    }

    async updateById(id: number, input: CategoryUpdateEntityInterface): Promise<CategoryEntityInterface> {
        const newTitle = input.title;
        const titleChanged = isDefined(newTitle);
        const hasAiFields = isDefined(input.titleEn) || isDefined(input.titleTags);
        const shouldResetAiFields = titleChanged && !hasAiFields;

        const [category] = await this.db
            .update(CategoryEntityTable)
            .set({
                ...input,
                ...(titleChanged && { titleSearch: newTitle.toLowerCase() }),
                ...(shouldResetAiFields && { titleEn: null, titleTags: null, tagsGeneratedAt: null })
            })
            .where(eq(CategoryEntityTable.id, id))
            .returning();

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

    async countTransactionEntries(categoryId: number): Promise<number> {
        const [result] = await this.db
            .select({ count: count() })
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.categoryId, categoryId));

        return result.count;
    }

    async reassignTransactionEntries(fromCategoryId: number, toCategoryId: number): Promise<void> {
        await this.db
            .update(TransactionEntryEntityTable)
            .set({ categoryId: toCategoryId })
            .where(eq(TransactionEntryEntityTable.categoryId, fromCategoryId));
    }

    async truncate(includeDefault: boolean, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .delete(CategoryEntityTable)
            .where(includeDefault ? eq(CategoryEntityTable.isSystemCategory, false) : eq(CategoryEntityTable.isDefault, false));
    }

    findWithoutTags() {
        return this.db.query.CategoryEntityTable.findMany({
            where: and(isNull(CategoryEntityTable.tagsGeneratedAt), eq(CategoryEntityTable.isSystemCategory, false))
        });
    }

    findAllNonSystem() {
        return this.db.query.CategoryEntityTable.findMany({
            where: eq(CategoryEntityTable.isSystemCategory, false)
        });
    }

    async updateTranslation(id: number, titleEn: string, titleTags: string): Promise<void> {
        await this.db
            .update(CategoryEntityTable)
            .set({ titleEn, titleTags, tagsGeneratedAt: new Date() })
            .where(eq(CategoryEntityTable.id, id));
    }

    async clearTranslation(id: number): Promise<void> {
        await this.db
            .update(CategoryEntityTable)
            .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .where(eq(CategoryEntityTable.id, id));
    }

    async findUntranslated(limit: number, tx?: DB): Promise<{ id: number; title: string }[]> {
        return (tx ?? this.db)
            .select({ id: CategoryEntityTable.id, title: CategoryEntityTable.title })
            .from(CategoryEntityTable)
            .where(and(isNull(CategoryEntityTable.titleEn), isNull(CategoryEntityTable.deletedAt)))
            .limit(limit);
    }

    async countUntranslated(tx?: DB): Promise<number> {
        const [row] = await (tx ?? this.db)
            .select({ value: count() })
            .from(CategoryEntityTable)
            .where(and(isNull(CategoryEntityTable.titleEn), isNull(CategoryEntityTable.deletedAt)));

        return row.value;
    }

    async countAll(tx?: DB): Promise<number> {
        const [row] = await (tx ?? this.db)
            .select({ value: count() })
            .from(CategoryEntityTable)
            .where(isNull(CategoryEntityTable.deletedAt));

        return row.value;
    }

    async resetAllTranslations(tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(CategoryEntityTable)
            .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .where(isNull(CategoryEntityTable.deletedAt));
    }
}
