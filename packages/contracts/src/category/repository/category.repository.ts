import { and, count, eq, getTableColumns, isNull, like, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TranslatableRepositoryBase } from '../../@generic/repository/translatable-repository.base';
import { DB } from '../../@generic/type/db.type';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type * as schema from '../../schema';
import type { CategoryEntityInterface } from '../entity/category-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class CategoryRepository extends TranslatableRepositoryBase {
    constructor(db: ExpoSQLiteDatabase<typeof schema>) {
        super(db, CategoryEntityTable, {
            id: CategoryEntityTable.id,
            title: CategoryEntityTable.title,
            titleEn: CategoryEntityTable.titleEn,
            titleTags: CategoryEntityTable.titleTags,
            tagsGeneratedAt: CategoryEntityTable.tagsGeneratedAt,
            deletedAt: CategoryEntityTable.deletedAt
        });
    }

    findAll() {
        return this.db.query.CategoryEntityTable.findMany();
    }

    findBySearchQuery(search: string, includeDefault: boolean) {
        const trimmed = search.trim();
        const baseFilter = includeDefault
            ? eq(CategoryEntityTable.isSystemCategory, false)
            : and(eq(CategoryEntityTable.isDefault, false), eq(CategoryEntityTable.isSystemCategory, false));

        if (!isNotEmptyString(trimmed)) {
            return this.db
                .select(getTableColumns(CategoryEntityTable))
                .from(CategoryEntityTable)
                .leftJoin(TransactionEntryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
                .where(baseFilter)
                .groupBy(CategoryEntityTable.id)
                .orderBy(sql`COUNT(${TransactionEntryEntityTable.id}) DESC`);
        }

        const pattern = `%${trimmed.toLowerCase()}%`;
        const searchExpr = or(
            like(CategoryEntityTable.titleSearch, pattern),
            like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleEn}, ''))`, pattern),
            like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleTags}, ''))`, pattern)
        );

        return this.db
            .select(getTableColumns(CategoryEntityTable))
            .from(CategoryEntityTable)
            .leftJoin(TransactionEntryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .where(and(searchExpr, baseFilter))
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
}
