import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const TagEntityTable = sqliteTable(
    'tags',
    withBaseEntityTableColumns({
        title: text().notNull(),
        titleSearch: text('title_search').default('').notNull(),
        titleEn: text('title_en'),
        titleTags: text('title_tags'),
        tagsGeneratedAt: int('tags_generated_at', { mode: 'timestamp' })
    })
);
