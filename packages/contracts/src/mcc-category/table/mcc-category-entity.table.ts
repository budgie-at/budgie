import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { MccGroupEntityTable } from '../../mcc-group/table/mcc-group-entity.table';

export const MccCategoryEntityTable = sqliteTable(
    'mcc_categories',
    withBaseEntityTableColumns({
        mcc: text().notNull().unique(),
        mccGroupId: int('mcc_group_id', { mode: 'number' })
            .notNull()
            .references(() => MccGroupEntityTable.id),
        shortDescription: text('short_description').notNull(),
        fullDescription: text('full_description').notNull()
    })
);
