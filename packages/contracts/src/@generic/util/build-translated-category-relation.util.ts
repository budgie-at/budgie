import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { LanguageEnum } from '../enum/language.enum';

import type { SQLOperator } from 'drizzle-orm';

export const buildTranslatedCategoryRelation = (language: LanguageEnum) =>
    ({
        columns: { title: false },
        extras: {
            title: (category: typeof CategoryEntityTable, { sql: rawSql }: SQLOperator) =>
                rawSql<string>`COALESCE(
                (SELECT default_category_translations.title
                 FROM default_category_translations
                 WHERE default_category_translations.category_id = ${category.id}
                   AND default_category_translations.language = ${language}),
                ${category.title}
            )`.as('title')
        }
    }) as const;
