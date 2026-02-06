import { blob, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const TitleEmbeddingEntityTable = sqliteTable(
    'title_embeddings',
    withBaseEntityTableColumns({
        title: text().notNull(),
        context: text().notNull().unique(),
        embedding: blob({ mode: 'buffer' }).notNull(),
        dimensions: int({ mode: 'number' }).notNull()
    })
);
