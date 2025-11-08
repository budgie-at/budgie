import { index, int, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const AccountBalanceEntityTable = sqliteTable(
    'account_balances',
    withBaseEntityTableColumns({
        parentAccountId: int('parent_account_id', { mode: 'number' }),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        instrumentId: int('instrument_id', { mode: 'number' }).notNull(),
        amount: int('amount', { mode: 'number' }).notNull()
    }),
    columns => ({
        uidxAccountTs: uniqueIndex('u_idx_account_balances_account_ts').on(columns.accountId, columns.createdAt),
        idxParentTs: index('idx_account_balances_parent_ts').on(columns.parentAccountId, columns.createdAt)
    })
);
