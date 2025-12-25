import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const AccountBalanceEntityTable = sqliteTable(
    'account_balances',
    withBaseEntityTableColumns({
        accountId: int('account_id', { mode: 'number' }).notNull().unique(),
        amount: int('amount', { mode: 'number' }).notNull()
    })
);
