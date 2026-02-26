import { int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { uint8BlobColumn } from '../../@generic/util/uint8-blob-column.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const CommentEmbeddingEntityTable = sqliteTable(
    'comment_embeddings',
    withBaseEntityTableColumns({
        comment: text().notNull(),
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id)
            .notNull(),
        embedding: uint8BlobColumn().notNull(),
        dimensions: int({ mode: 'number' }).notNull()
    }),
    table => [unique().on(table.comment, table.categoryId)]
);
