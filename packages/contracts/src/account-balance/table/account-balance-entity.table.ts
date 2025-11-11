import { int, sqliteTable } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const AccountBalanceEntityTable = sqliteTable(
    'account_balances',
    withBaseEntityTableColumns({
        parentAccountId: int('parent_account_id', { mode: 'number' }),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        amount: int('amount', { mode: 'number' }).notNull()
    })
);
