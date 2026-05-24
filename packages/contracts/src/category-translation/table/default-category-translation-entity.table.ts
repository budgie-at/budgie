import { int, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { convertEnumToDrizzleEnum } from '../../@generic/util/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const DefaultCategoryTranslationEntityTable = sqliteTable(
    'default_category_translations',
    withBaseEntityTableColumns({
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id)
            .notNull(),
        language: text({ enum: convertEnumToDrizzleEnum(LanguageEnum) })
            .$type<LanguageEnum>()
            .notNull(),
        title: text().notNull()
    }),
    table => [uniqueIndex('default_category_translations_category_language_idx').on(table.categoryId, table.language)]
);
