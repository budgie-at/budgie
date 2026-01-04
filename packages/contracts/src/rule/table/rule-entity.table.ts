import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const RuleEntityTable = sqliteTable(
    'rules',
    withBaseEntityTableColumns({
        title: text('title').notNull(),
        titleSearch: text('title_search').default('').notNull(),
        priority: int('priority', { mode: 'number' }).notNull().default(0),
        enabled: int('enabled', { mode: 'boolean' }).notNull().default(true)
    })
);
