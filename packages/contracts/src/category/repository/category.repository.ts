import { and, count, eq, getTableColumns, inArray, isNull, like, or, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { TranslatableRepositoryBase } from '../../@generic/repository/translatable-repository.base';
import { Db } from '../../@generic/service/db.service';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { BORROWING_CATEGORY_ID } from '../constant/borrowing-category-id.constant';
import { LENDING_CATEGORY_ID } from '../constant/lending-category-id.constant';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class CategoryRepository extends TranslatableRepositoryBase {
    readonly create = Effect.fn('CategoryRepository.create')(function* (this: CategoryRepository, input: CategoryCreateEntityInterface) {
        const [category] = yield* this.bulkCreate([input]);

        return category;
    });

    readonly updateById = Effect.fn('CategoryRepository.updateById')(function* (id: number, input: CategoryUpdateEntityInterface) {
        const newTitle = input.title;
        const titleChanged = isDefined(newTitle);

        const [category] = yield* Db.query(db =>
            db
                .update(CategoryEntityTable)
                .set({
                    ...input,
                    ...(titleChanged && { titleSearch: newTitle.toLowerCase() }),
                    ...(titleChanged && { titleEn: null, titleTags: null, tagsGeneratedAt: null })
                })
                .where(eq(CategoryEntityTable.id, id))
                .returning()
        );

        return category;
    });

    constructor(private readonly db: ExpoSQLiteDatabase<typeof schema>) {
        super(CategoryEntityTable, {
            id: CategoryEntityTable.id,
            title: CategoryEntityTable.title,
            titleEn: CategoryEntityTable.titleEn,
            titleTags: CategoryEntityTable.titleTags,
            tagsGeneratedAt: CategoryEntityTable.tagsGeneratedAt,
            deletedAt: CategoryEntityTable.deletedAt
        });
    }

    readonly bulkCreate = (inputs: CategoryCreateEntityInterface[]) =>
        Db.query(db =>
            db
                .insert(CategoryEntityTable)
                .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
                .returning()
        );

    readonly findActiveById = (id: number) =>
        Db.query(db =>
            db
                .select()
                .from(CategoryEntityTable)
                .where(and(eq(CategoryEntityTable.id, id), isNull(CategoryEntityTable.deletedAt)))
                .limit(1)
        ).pipe(Effect.map(categories => categories.at(0)));

    readonly deleteById = (id: number) => Db.query(db => db.delete(CategoryEntityTable).where(eq(CategoryEntityTable.id, id)));

    readonly countTransactionEntries = (categoryId: number) =>
        Db.query(db =>
            db.select({ count: count() }).from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.categoryId, categoryId))
        ).pipe(Effect.map(([result]) => result.count));

    readonly reassignTransactionEntries = (fromCategoryId: number, toCategoryId: number) =>
        Db.query(db =>
            db
                .update(TransactionEntryEntityTable)
                .set({ categoryId: toCategoryId })
                .where(eq(TransactionEntryEntityTable.categoryId, fromCategoryId))
        );

    readonly truncate = (includeDefault: boolean) =>
        Db.query(db =>
            db
                .delete(CategoryEntityTable)
                .where(includeDefault ? eq(CategoryEntityTable.isSystemCategory, false) : eq(CategoryEntityTable.isDefault, false))
        );

    readonly updateTranslation = (id: number, titleEn: string, titleTags: string) =>
        Db.query(db =>
            db.update(CategoryEntityTable).set({ titleEn, titleTags, tagsGeneratedAt: new Date() }).where(eq(CategoryEntityTable.id, id))
        ).pipe(Effect.asVoid);

    readonly clearTranslation = (id: number) =>
        Db.query(db =>
            db
                .update(CategoryEntityTable)
                .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
                .where(eq(CategoryEntityTable.id, id))
        );

    findAllNonSystemLocalized(language: LanguageEnum) {
        return this.buildLocalizedCategoryBaseQuery(language).where(eq(CategoryEntityTable.isSystemCategory, false));
    }

    findBySearchQuery(search: string, includeDefault: boolean, language: LanguageEnum) {
        const trimmed = search.trim();
        const selectableFilter = or(
            eq(CategoryEntityTable.isSystemCategory, false),
            inArray(CategoryEntityTable.id, [LENDING_CATEGORY_ID, BORROWING_CATEGORY_ID])
        );
        const baseFilter = includeDefault ? selectableFilter : and(eq(CategoryEntityTable.isDefault, false), selectableFilter);
        const sortedByUsage = this.buildLocalizedCategoryBaseQuery(language).leftJoin(
            TransactionEntryEntityTable,
            eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId)
        );

        if (!isNotEmptyString(trimmed)) {
            return sortedByUsage
                .where(baseFilter)
                .groupBy(CategoryEntityTable.id)
                .orderBy(sql`COUNT(${TransactionEntryEntityTable.id}) DESC`);
        }

        const pattern = `%${trimmed.toLowerCase()}%`;
        const localizedTitleSearchExpressions = this.buildSearchPatterns(trimmed).map(searchPattern =>
            like(DefaultCategoryTranslationEntityTable.title, searchPattern)
        );
        const searchExpr = or(
            like(CategoryEntityTable.titleSearch, pattern),
            like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleEn}, ''))`, pattern),
            like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleTags}, ''))`, pattern),
            ...localizedTitleSearchExpressions
        );

        return sortedByUsage
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

    findById(id: number, language: LanguageEnum) {
        return this.buildLocalizedCategoryBaseQuery(language).where(eq(CategoryEntityTable.id, id)).limit(1);
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

    private selectWithLocalizedTitle() {
        return {
            ...getTableColumns(CategoryEntityTable),
            title: sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`.as('title')
        };
    }

    private buildLocalizedCategoryBaseQuery(language: LanguageEnum) {
        return this.db
            .select(this.selectWithLocalizedTitle())
            .from(CategoryEntityTable)
            .leftJoin(
                DefaultCategoryTranslationEntityTable,
                and(
                    eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                    eq(DefaultCategoryTranslationEntityTable.language, language)
                )
            );
    }

    private buildSearchPatterns(search: string): string[] {
        const lowerSearch = search.toLowerCase();
        const upperSearch = search.toUpperCase();
        const capitalizedSearch = `${lowerSearch.charAt(0).toUpperCase()}${lowerSearch.slice(1)}`;

        return [...new Set([search, lowerSearch, upperSearch, capitalizedSearch].map(value => `%${value}%`))];
    }
}
