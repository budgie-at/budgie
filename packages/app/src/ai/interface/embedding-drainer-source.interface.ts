import type { Db, DbError, EmbeddingPendingContextBaseInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface EmbeddingDrainerSourceInterface<TContext extends EmbeddingPendingContextBaseInterface> {
    readonly fetchPending: (limit: number) => Effect.Effect<TContext[], DbError, Db>;
    readonly countPending: Effect.Effect<number, DbError, Db>;
    readonly buildPrompt: (context: TContext) => string;
    readonly upsert: (context: TContext, embedding: Uint8Array, dimensions: number) => Effect.Effect<number | null, DbError, Db>;
    readonly replaceTags: (embeddingId: number, tagIds: number[]) => Effect.Effect<void, DbError, Db>;
}
