import { int } from 'drizzle-orm/sqlite-core';

import type { SQLiteColumnBuilderBase } from 'drizzle-orm/sqlite-core/columns/common';

const baseFields = {
    id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    createdAt: int({ mode: 'timestamp' }).notNull(),
    updatedAt: int({ mode: 'timestamp' }).notNull(),
    deletedAt: int({ mode: 'timestamp' })
} as const;

export const withBaseEntityTableColumns = <T extends Record<string, SQLiteColumnBuilderBase>>(columns: T): T & typeof baseFields => ({
    ...baseFields,
    ...columns
});
