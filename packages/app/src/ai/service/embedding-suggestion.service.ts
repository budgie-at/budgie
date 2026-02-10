import { EmbeddingSuggestionService } from '@budgie/ai';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';

export const embeddingSuggestionService = new EmbeddingSuggestionService(titleEmbeddingRepository);
