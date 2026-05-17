import { sql } from 'drizzle-orm';

import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { LanguageEnum } from '../enum/language.enum';

export const buildTranslatedCategoryRelation = (language: LanguageEnum) =>
    ({
        columns: { title: false },
        extras: {
            title: sql<string>`COALESCE(
                (SELECT default_category_translations.title
                 FROM default_category_translations
                 WHERE default_category_translations.category_id = ${CategoryEntityTable.id}
                   AND default_category_translations.language = ${language}),
                ${CategoryEntityTable.title}
            )`.as('title')
        }
    }) as const;
