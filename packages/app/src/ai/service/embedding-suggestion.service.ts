import { EmbeddingSuggestionService } from '@budgie/ai';

import { commentEmbeddingRepository, merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';

import { embeddingService } from './embedding.service';

export const embeddingSuggestionService = new EmbeddingSuggestionService(
    { merchant: merchantEmbeddingRepository, comment: commentEmbeddingRepository },
    embeddingService
);
