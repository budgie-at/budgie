import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export interface TranslatableColumnsInterface {
    readonly id: SQLiteColumn;
    readonly title: SQLiteColumn;
    readonly titleEn: SQLiteColumn;
    readonly titleTags: SQLiteColumn;
    readonly tagsGeneratedAt: SQLiteColumn;
    readonly deletedAt: SQLiteColumn;
}
