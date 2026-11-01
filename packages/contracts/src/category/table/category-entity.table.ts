import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { CategoryIconSourceEnum } from '../enum/category-icon-source.enum';

import type { UserIconType } from '../../@generic/type/user-icon.type';

export const CategoryEntityTable = sqliteTable(
    'categories',
    withBaseEntityTableColumns({
        title: text().default('').notNull(),
        titleSearch: text('title_search').default('').notNull(),
        titleEn: text('title_en'),
        titleTags: text('title_tags'),
        tagsGeneratedAt: int('tags_generated_at', { mode: 'timestamp' }),
        icon: text().$type<UserIconType>().notNull(),
        iconSource: text('icon_source', { enum: convertEnumToDrizzleEnum(CategoryIconSourceEnum) })
            .notNull()
            .default(CategoryIconSourceEnum.AUTO)
            .$type<CategoryIconSourceEnum>(),
        parentId: int('parent_id', { mode: 'number' }),
        isDefault: int('is_default', { mode: 'boolean' }).default(false).notNull(),
        isSystemCategory: int('is_system_category', { mode: 'boolean' }).default(false).notNull()
    })
);
