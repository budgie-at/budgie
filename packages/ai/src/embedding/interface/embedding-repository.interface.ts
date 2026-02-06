import { EmbeddingContextResultInterface } from '@budgie/contracts';

export interface EmbeddingRepositoryInterface {
    findSimilarContexts(queryEmbedding: Uint8Array, limit: number): EmbeddingContextResultInterface[];
    findCategoriesByContexts(contexts: string[]): Promise<{ categoryId: number; count: number }[]>;
    findTagsByContexts(contexts: string[]): Promise<{ tagId: number; count: number }[]>;
}
