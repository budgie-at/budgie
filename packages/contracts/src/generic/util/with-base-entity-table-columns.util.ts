import { int } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../constant/current-timestamp.constant';

import type { SQLiteColumnBuilderBase } from 'drizzle-orm/sqlite-core/columns/common';

const baseFields = {
    id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    createdAt: int({ mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
    updatedAt: int({ mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
    deletedAt: int({ mode: 'timestamp' })
} as const;

export const withBaseEntityTableColumns = <T extends Record<string, SQLiteColumnBuilderBase>>(columns: T): T & typeof baseFields => ({
    ...baseFields,
    ...columns
});
