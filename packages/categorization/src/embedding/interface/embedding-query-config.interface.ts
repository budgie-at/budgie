import type { DB } from '@budgie/contracts';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type * as Effect from 'effect/Effect';

export interface EmbeddingQueryConfigInterface<TUpsert> {
    readonly similarCategoriesQuery: string;
    readonly similarTagsQuery: string;
    readonly vecTableName: string;
    readonly embeddingTable: SQLiteTable;
    readonly deletedAtColumn: SQLiteColumn;
    readonly tagTable: SQLiteTable;
    readonly foreignKeyColumn: SQLiteColumn;
    readonly createTagRow: (embeddingId: number, tagId: number) => Record<string, number>;
    readonly upsertRow: (db: DB, params: TUpsert) => Effect.Effect<{ readonly id: number }[], unknown>;
}
