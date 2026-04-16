import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

export interface ReplaceEmbeddingTagsParamsInterface {
    readonly tagTable: SQLiteTable;
    readonly foreignKeyColumn: SQLiteColumn;
    readonly embeddingId: number;
    readonly tagIds: number[];
    readonly createTagRow: (tagId: number) => Record<string, number>;
}
