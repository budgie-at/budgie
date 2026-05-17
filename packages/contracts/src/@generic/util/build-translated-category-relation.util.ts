import { and, eq, sql } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { LanguageEnum } from '../enum/language.enum';

export const buildTranslatedCategoryRelation = (language: LanguageEnum) =>
    ({
        columns: { title: false },
        extras: {
            title: sql<string>`COALESCE(
                (SELECT ${DefaultCategoryTranslationEntityTable.title}
                 FROM ${DefaultCategoryTranslationEntityTable}
                 WHERE ${and(
                     eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                     eq(DefaultCategoryTranslationEntityTable.language, language)
                 )}),
                ${CategoryEntityTable.title}
            )`.as('title')
        }
    }) as const;
