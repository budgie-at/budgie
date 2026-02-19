import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { uint8BlobColumn } from '../../@generic/util/uint8-blob-column.util';
import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

export const TitleEmbeddingEntityTable = sqliteTable(
    'title_embeddings',
    withBaseEntityTableColumns({
        title: text().notNull(),
        context: text().notNull().unique(),
        embedding: uint8BlobColumn().notNull(),
        dimensions: int({ mode: 'number' }).notNull()
    })
);
