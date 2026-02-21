import { CommentEmbeddingRepository, MerchantEmbeddingRepository } from '@budgie/contracts';

export interface EmbeddingSuggestionRepositoriesInterface {
    readonly merchant: MerchantEmbeddingRepository;
    readonly comment: CommentEmbeddingRepository;
}
