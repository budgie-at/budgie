import { EmbeddingContextResultInterface } from '@budgie/contracts';

export interface EmbeddingPatternRepositoryInterface {
    findRecentContexts(limit: number): Promise<EmbeddingContextResultInterface[]>;
    findEmbeddingByContext(context: string): Promise<Uint8Array | null>;
    findSimilarTitlesByContexts(contextEmbeddings: { context: string; embedding: Uint8Array }[], limit: number): string[];
}
