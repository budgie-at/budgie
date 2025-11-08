import { int, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

export const TransactionEntryToTagEntityTable = sqliteTable(
    'transactions_to_tags',
    {
        transactionEntryId: int('transaction_entry_id', { mode: 'number' }).notNull(),
        tagId: int('tag_id', { mode: 'number' }).notNull()
    },
    ({ transactionEntryId, tagId }) => [primaryKey({ columns: [transactionEntryId, tagId] })]
);
