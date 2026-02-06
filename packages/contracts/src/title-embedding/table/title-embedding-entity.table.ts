import { customType, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/util/with-base-entity-table-columns.util';

const uint8Blob = customType<{ data: Uint8Array; driverData: Uint8Array }>({
    dataType: () => 'blob',
    toDriver: (value: Uint8Array) => value,
    fromDriver: (value: Uint8Array) => value
});

export const TitleEmbeddingEntityTable = sqliteTable(
    'title_embeddings',
    withBaseEntityTableColumns({
        title: text().notNull(),
        context: text().notNull().unique(),
        embedding: uint8Blob().notNull(),
        dimensions: int({ mode: 'number' }).notNull()
    })
);
