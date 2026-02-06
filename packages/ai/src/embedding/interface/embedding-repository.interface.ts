import { TitleEmbeddingEntityInterface } from '@budgie/contracts';

export interface EmbeddingRepositoryInterface {
    findAll(): Promise<TitleEmbeddingEntityInterface[]>;
    findCategoriesByContexts(contexts: string[]): Promise<{ categoryId: number; count: number }[]>;
    findTagsByContexts(contexts: string[]): Promise<{ tagId: number; count: number }[]>;
}
