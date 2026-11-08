import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';

export const TagEntityTable = sqliteTable(
    'tags',
    withBaseEntityTableColumns({
        ...withSyncIdentityColumns(),
        title: text().notNull(),
        titleSearch: text('title_search').default('').notNull(),
        titleEn: text('title_en'),
        titleTags: text('title_tags'),
        tagsGeneratedAt: int('tags_generated_at', { mode: 'timestamp' })
    }),
    table => [syncIdentityUniqueIndex('tags', table)]
);
