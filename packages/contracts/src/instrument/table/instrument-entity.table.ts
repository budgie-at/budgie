import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const InstrumentEntityTable = sqliteTable(
    'instruments',
    withBaseEntityTableColumns({
        accountId: int('account_id', { mode: 'number' }).notNull(),
        symbol: text().notNull()
    })
);
