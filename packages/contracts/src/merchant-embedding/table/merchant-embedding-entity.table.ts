import { int, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { withBaseEntityTableColumns } from '../../@generic/utils/with-base-entity-table-columns.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';

export const MerchantEmbeddingEntityTable = sqliteTable(
    'merchant_embeddings',
    withBaseEntityTableColumns({
        title: text().notNull(),
        mccDescription: text('mcc_description').notNull().default(''),
        categoryId: int('category_id', { mode: 'number' })
            .references(() => CategoryEntityTable.id)
            .notNull(),
        comment: text().notNull().default('')
    }),
    table => [unique().on(table.title, table.mccDescription, table.categoryId)]
);
