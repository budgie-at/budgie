import { EmbeddingContextResultInterface, TitleEmbeddingEntityInterface } from '@budgie/contracts';

export interface EmbeddingPatternRepositoryInterface {
    findAll(): Promise<TitleEmbeddingEntityInterface[]>;
    findRecentContexts(limit: number): Promise<EmbeddingContextResultInterface[]>;
}
