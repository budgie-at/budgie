import { int, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

export const TransactionToTagEntityTable = sqliteTable(
    'transaction_tags',
    {
        transactionId: int('transaction_id', { mode: 'number' }).notNull(),
        tagId: int('tag_id', { mode: 'number' }).notNull()
    },
    ({ transactionId, tagId }) => [primaryKey({ columns: [transactionId, tagId] })]
);
