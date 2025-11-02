import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const HoldingEntityTable = sqliteTable(
    'holdings',
    withBaseEntityTableColumns({
        instrument: text().notNull(),
        quantity: int({ mode: 'number' }).notNull()
    })
);
