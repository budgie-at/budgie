import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const TransactionEntryEntityTable = sqliteTable(
    'transaction_entries',
    withBaseEntityTableColumns({
        title: text('title').notNull(),
        accountId: text('account_id').notNull(),
        categoryId: text('category_id').notNull(),
        parentAccountId: text('parent_account_id'),
        transactionId: text('transaction_id').notNull(),
        amount: int('amount', { mode: 'number' }).notNull(),
        description: text('description').default('').notNull()
    }),
    columns => ({
        idxAccountCreatedAt: index('ix_entries_account_created_at').on(columns.accountId, columns.createdAt),
        idxParentCreatedAt: index('ix_entries_parent_created_at').on(columns.parentAccountId, columns.createdAt),
        idxTxn: index('ix_entries_txn').on(columns.transactionId)
    })
);
