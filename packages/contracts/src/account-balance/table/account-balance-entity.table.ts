import { blob, int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const AccountBalanceEntityTable = sqliteTable(
    'account_balances',
    withBaseEntityTableColumns({
        accountId: int('account_id', { mode: 'number' }).notNull().unique(),
        amount: blob('amount', { mode: 'bigint' }).notNull()
    })
);
