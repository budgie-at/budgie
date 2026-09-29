import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

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
        parentId: int('parent_id', { mode: 'number' }),
        isDefault: int('is_default', { mode: 'boolean' }).default(false).notNull(),
        isSystemCategory: int('is_system_category', { mode: 'boolean' }).default(false).notNull()
    })
);
