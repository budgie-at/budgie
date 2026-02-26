import { EmbeddingSuggestionService } from '@budgie/ai';

import { commentEmbeddingRepository, merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';

export const embeddingSuggestionService = new EmbeddingSuggestionService({
    merchant: merchantEmbeddingRepository,
    comment: commentEmbeddingRepository
});
