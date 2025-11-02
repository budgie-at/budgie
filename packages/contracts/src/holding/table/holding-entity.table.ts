import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const HoldingEntityTable = sqliteTable(
    'holdings',
    withBaseEntityTableColumns({
        instrumentId: int('instrument_id', { mode: 'number' }).notNull(),
        quantity: int({ mode: 'number' }).notNull()
    })
);
