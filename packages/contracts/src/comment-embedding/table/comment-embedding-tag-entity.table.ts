import { int, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

import { tagIdColumn } from '../../@generic/util/tag-id-column.util';

import { CommentEmbeddingEntityTable } from './comment-embedding-entity.table';

export const CommentEmbeddingTagEntityTable = sqliteTable(
    'comment_embedding_tags',
    {
        commentEmbeddingId: int('comment_embedding_id', { mode: 'number' })
            .references(() => CommentEmbeddingEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: tagIdColumn()
    },
    ({ commentEmbeddingId, tagId }) => [primaryKey({ columns: [commentEmbeddingId, tagId] })]
);
