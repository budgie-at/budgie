import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

export interface EmbeddingQueryConfigInterface {
    readonly similarCategoriesQuery: string;
    readonly similarTagsQuery: string;
    readonly vecTableName: string;
    readonly embeddingTable: SQLiteTable;
    readonly deletedAtColumn: SQLiteColumn;
    readonly tagTable: SQLiteTable;
    readonly foreignKeyColumn: SQLiteColumn;
    readonly createTagRow: (embeddingId: number, tagId: number) => Record<string, number>;
}
