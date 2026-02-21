import { int, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

import { tagIdColumn } from '../../@generic/util/tag-id-column.util';

import { MerchantEmbeddingEntityTable } from './merchant-embedding-entity.table';

export const MerchantEmbeddingTagEntityTable = sqliteTable(
    'merchant_embedding_tags',
    {
        merchantEmbeddingId: int('merchant_embedding_id', { mode: 'number' })
            .references(() => MerchantEmbeddingEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: tagIdColumn()
    },
    ({ merchantEmbeddingId, tagId }) => [primaryKey({ columns: [merchantEmbeddingId, tagId] })]
);
