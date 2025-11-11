import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const TagEntityTable = sqliteTable(
    'tags',
    withBaseEntityTableColumns({
        title: text().notNull()
    })
);
