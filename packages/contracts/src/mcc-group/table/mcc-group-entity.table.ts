import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const MccGroupEntityTable = sqliteTable(
    'mcc_groups',
    withBaseEntityTableColumns({
        type: text().notNull().unique(),
        description: text().notNull()
    })
);
