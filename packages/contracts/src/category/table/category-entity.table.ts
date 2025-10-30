import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const CategoryEntityTable = sqliteTable(
    'categories',
    withBaseEntityTableColumns({
        title: text().default('').notNull(),
        icon: text().notNull()
    })
);
