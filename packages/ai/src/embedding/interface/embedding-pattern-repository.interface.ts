import { EmbeddingContextResultInterface } from '@budgie/contracts';

export interface EmbeddingPatternRepositoryInterface {
    findRecentContexts(limit: number): Promise<EmbeddingContextResultInterface[]>;
    findEmbeddingsByContexts(contexts: string[]): Promise<Map<string, Uint8Array>>;
    findSimilarTitlesByContexts(contextEmbeddings: { context: string; embedding: Uint8Array }[], limit: number): Promise<string[]>;
}
