import { int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const CommentEmbeddingEntityTable = sqliteTable(
    'comment_embeddings',
    withBaseEntityTableColumns({
        comment: text().notNull(),
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id)
            .notNull()
    }),
    table => [unique().on(table.comment, table.categoryId)]
);
