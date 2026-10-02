import { and, count, eq, getTableColumns, inArray, isNull, like, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { Db } from '../../@generic/service/db.service';
import { makeTranslatableRepository } from '../../@generic/util/make-translatable-repository.util';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { BORROWING_CATEGORY_ID } from '../constant/borrowing-category-id.constant';
import { LENDING_CATEGORY_ID } from '../constant/lending-category-id.constant';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryUpdateEntityInterface } from '../entity/category-update-entity.interface';
import { CategoryEntityTable } from '../table/category-entity.table';

import type { DB } from '../../@generic/type/db.type';

export class CategoryRepository extends Context.Service<CategoryRepository>()('@budgie/contracts/CategoryRepository', {
    make: Effect.sync(() => {
        const bulkCreate = (inputs: CategoryCreateEntityInterface[]) =>
            Db.query(db =>
                db
                    .insert(CategoryEntityTable)
                    .values(inputs.map(input => ({ ...input, titleSearch: input.title.toLowerCase() })))
                    .returning()
            );

        const buildLocalizedCategoryBaseQuery = (db: DB, language: LanguageEnum) =>
            db
                .select({
                    ...getTableColumns(CategoryEntityTable),
                    title: sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`.as('title')
                })
                .from(CategoryEntityTable)
                .leftJoin(
                    DefaultCategoryTranslationEntityTable,
                    and(
                        eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                        eq(DefaultCategoryTranslationEntityTable.language, language)
                    )
                );

        const buildSearchPatterns = (search: string): string[] => {
            const lowerSearch = search.toLowerCase();
            const upperSearch = search.toUpperCase();
            const capitalizedSearch = `${lowerSearch.charAt(0).toUpperCase()}${lowerSearch.slice(1)}`;

            return [...new Set([search, lowerSearch, upperSearch, capitalizedSearch].map(value => `%${value}%`))];
        };

        return {
            ...makeTranslatableRepository(CategoryEntityTable, {
                id: CategoryEntityTable.id,
                title: CategoryEntityTable.title,
                titleEn: CategoryEntityTable.titleEn,
                titleTags: CategoryEntityTable.titleTags,
                tagsGeneratedAt: CategoryEntityTable.tagsGeneratedAt,
                deletedAt: CategoryEntityTable.deletedAt
            }),
            bulkCreate,
            create: Effect.fn('CategoryRepository.create')(function* (input: CategoryCreateEntityInterface) {
                const [category] = yield* bulkCreate([input]);

                return category;
            }),
            updateById: Effect.fn('CategoryRepository.updateById')(function* (id: number, input: CategoryUpdateEntityInterface) {
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
            }),
            findActiveById: (id: number) =>
                Db.query(db =>
                    db
                        .select()
                        .from(CategoryEntityTable)
                        .where(and(eq(CategoryEntityTable.id, id), isNull(CategoryEntityTable.deletedAt)))
                        .limit(1)
                ).pipe(Effect.map(categories => categories.at(0))),
            deleteById: (id: number) => Db.query(db => db.delete(CategoryEntityTable).where(eq(CategoryEntityTable.id, id))),
            countTransactionEntries: (categoryId: number) =>
                Db.query(db =>
                    db
                        .select({ count: count() })
                        .from(TransactionEntryEntityTable)
                        .where(eq(TransactionEntryEntityTable.categoryId, categoryId))
                ).pipe(Effect.map(([result]) => result.count)),
            reassignTransactionEntries: (fromCategoryId: number, toCategoryId: number) =>
                Db.query(db =>
                    db
                        .update(TransactionEntryEntityTable)
                        .set({ categoryId: toCategoryId })
                        .where(eq(TransactionEntryEntityTable.categoryId, fromCategoryId))
                ),
            truncate: (includeDefault: boolean) =>
                Db.query(db =>
                    db
                        .delete(CategoryEntityTable)
                        .where(includeDefault ? eq(CategoryEntityTable.isSystemCategory, false) : eq(CategoryEntityTable.isDefault, false))
                ),
            updateTranslation: (id: number, titleEn: string, titleTags: string) =>
                Db.query(db =>
                    db
                        .update(CategoryEntityTable)
                        .set({ titleEn, titleTags, tagsGeneratedAt: new Date() })
                        .where(eq(CategoryEntityTable.id, id))
                ).pipe(Effect.asVoid),
            clearTranslation: (id: number) =>
                Db.query(db =>
                    db
                        .update(CategoryEntityTable)
                        .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
                        .where(eq(CategoryEntityTable.id, id))
                ),
            findAllNonSystemLocalized: (language: LanguageEnum) =>
                Db.query(db => buildLocalizedCategoryBaseQuery(db, language).where(eq(CategoryEntityTable.isSystemCategory, false))),
            findBySearchQuery: (search: string, includeDefault: boolean, language: LanguageEnum) => {
                const trimmed = search.trim();
                const selectableFilter = or(
                    eq(CategoryEntityTable.isSystemCategory, false),
                    inArray(CategoryEntityTable.id, [LENDING_CATEGORY_ID, BORROWING_CATEGORY_ID])
                );
                const baseFilter = includeDefault ? selectableFilter : and(eq(CategoryEntityTable.isDefault, false), selectableFilter);
                const pattern = `%${trimmed.toLowerCase()}%`;
                const searchFilter = isNotEmptyString(trimmed)
                    ? and(
                          or(
                              like(CategoryEntityTable.titleSearch, pattern),
                              like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleEn}, ''))`, pattern),
                              like(sql<string>`LOWER(COALESCE(${CategoryEntityTable.titleTags}, ''))`, pattern),
                              ...buildSearchPatterns(trimmed).map(searchPattern =>
                                  like(DefaultCategoryTranslationEntityTable.title, searchPattern)
                              )
                          ),
                          baseFilter
                      )
                    : baseFilter;

                return Db.query(db =>
                    buildLocalizedCategoryBaseQuery(db, language)
                        .leftJoin(TransactionEntryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
                        .where(searchFilter)
                        .groupBy(CategoryEntityTable.id)
                        .orderBy(sql`COUNT(${TransactionEntryEntityTable.id}) DESC`)
                );
            },
            count: (includeDefault: boolean) =>
                Db.query(db =>
                    includeDefault
                        ? db.select({ count: count() }).from(CategoryEntityTable)
                        : db.select({ count: count() }).from(CategoryEntityTable).where(eq(CategoryEntityTable.isDefault, false))
                ),
            findById: (id: number, language: LanguageEnum) =>
                Db.query(db => buildLocalizedCategoryBaseQuery(db, language).where(eq(CategoryEntityTable.id, id)).limit(1)),
            findWithoutTags: () =>
                Db.query(db =>
                    db.query.CategoryEntityTable.findMany({
                        where: and(isNull(CategoryEntityTable.tagsGeneratedAt), eq(CategoryEntityTable.isSystemCategory, false))
                    })
                ),
            findAllNonSystem: () =>
                Db.query(db =>
                    db.query.CategoryEntityTable.findMany({
                        where: eq(CategoryEntityTable.isSystemCategory, false)
                    })
                )
        };
    })
}) {
    static readonly layer = Layer.effect(CategoryRepository, CategoryRepository.make);
}
