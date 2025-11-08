import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const TransactionEntryEntityTable = sqliteTable(
    'transaction_entries',
    withBaseEntityTableColumns({
        title: text('title').notNull(),
        accountId: int('account_id', { mode: 'number' }).notNull(),
        categoryId: int('category_id', { mode: 'number' }).notNull(),
        parentAccountId: int('parent_account_id', { mode: 'number' }),
        instrumentId: int('instrument_id', { mode: 'number' }).notNull(),
        transactionId: int('transaction_id', { mode: 'number' }).notNull(),
        amount: int('amount', { mode: 'number' }).notNull(),
        description: text('description').default('').notNull()
    })
);
