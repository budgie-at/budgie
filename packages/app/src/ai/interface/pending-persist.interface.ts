import { EmbeddingPendingContextBaseInterface } from '@budgie/contracts';

export interface PendingPersistInterface<TContext extends EmbeddingPendingContextBaseInterface> {
    readonly context: TContext;
    readonly embeddingId: number;
    readonly skipped: boolean;
}
