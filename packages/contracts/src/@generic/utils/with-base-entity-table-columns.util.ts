import { int } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../constant/current-timestamp.constant';

import type { ColumnBuilderBase } from 'drizzle-orm';

const baseFields = {
    id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    createdAt: int('created_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
    updatedAt: int('updated_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
    deletedAt: int('deleted_at', { mode: 'timestamp' })
} as const;

export const withBaseEntityTableColumns = <T extends Record<string, ColumnBuilderBase>>(columns: T): T & typeof baseFields => ({
    ...baseFields,
    ...columns
});
