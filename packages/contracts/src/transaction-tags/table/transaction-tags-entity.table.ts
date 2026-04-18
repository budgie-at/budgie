import { index, int, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';

export const TransactionTagsEntityTable = sqliteTable(
    'transaction_tags',
    {
        transactionId: int('transaction_id', { mode: 'number' })
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: int('tag_id', { mode: 'number' })
            .references(() => TagEntityTable.id, { onDelete: 'cascade' })
            .notNull()
    },
    ({ transactionId, tagId }) => [primaryKey({ columns: [transactionId, tagId] }), index('transaction_tags_tag_idx').on(tagId)]
);
