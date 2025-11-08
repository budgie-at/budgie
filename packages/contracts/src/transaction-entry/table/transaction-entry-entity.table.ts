import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../generic/util/with-base-entity-table-columns.util';

export const TransactionEntryEntityTable = sqliteTable(
    'transaction_entries',
    withBaseEntityTableColumns({
        transactionId: text('transaction_id').notNull(),
        accountId: text('account_id').notNull(),
        parentAccountId: text('parent_account_id'),
        amount: int('amount', { mode: 'number' }).notNull()
    }),
    columns => ({
        idxAccountCreatedAt: index('ix_entries_account_created_at').on(columns.accountId, columns.createdAt),
        idxParentCreatedAt: index('ix_entries_parent_created_at').on(columns.parentAccountId, columns.createdAt),
        idxTxn: index('ix_entries_txn').on(columns.transactionId)
    })
);
