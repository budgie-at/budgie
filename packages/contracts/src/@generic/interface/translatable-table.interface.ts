import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

export interface TranslatableTableInterface extends SQLiteTable {
    readonly id: SQLiteColumn;
    readonly title: SQLiteColumn;
    readonly titleEn: SQLiteColumn;
    readonly titleTags: SQLiteColumn;
    readonly tagsGeneratedAt: SQLiteColumn;
    readonly deletedAt: SQLiteColumn;
}
