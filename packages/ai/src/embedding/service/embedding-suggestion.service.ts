import { CategoryEntityInterface, TagEntityInterface, TitleEmbeddingRepository } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_SEARCH_LIMIT
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(private readonly repository: TitleEmbeddingRepository) {}

    async suggestCategories(context: string, llm: LlmInterface, categories: CategoryEntityInterface[]): Promise<CategoryEntityInterface[]> {
        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] suggestCategories start', { context, categoriesCount: categories.length });

        const similarContexts = await this.findSimilarContexts(context, llm);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] similarContexts', { count: similarContexts.length, contexts: similarContexts.slice(0, 3) });

        if (!isNotEmptyArray(similarContexts)) {
            return [];
        }

        const categoryCounts = await this.repository.findCategoriesByContexts(similarContexts);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] categoryCounts', { count: categoryCounts.length, rows: categoryCounts.slice(0, 5) });

        return categoryCounts
            .map(row => categories.find(category => category.id === row.categoryId))
            .filter(isDefined)
            .slice(0, EMBEDDING_CATEGORY_SUGGESTION_LIMIT);
    }

    async suggestTags(context: string, llm: LlmInterface, allTags: TagEntityInterface[]): Promise<TagEntityInterface[]> {
        const similarContexts = await this.findSimilarContexts(context, llm);

        if (!isNotEmptyArray(similarContexts)) {
            return [];
        }

        const tagCounts = await this.repository.findTagsByContexts(similarContexts);

        return tagCounts
            .map(row => allTags.find(tag => tag.id === row.tagId))
            .filter(isDefined)
            .slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);
    }

    private async findSimilarContexts(context: string, llm: LlmInterface): Promise<string[]> {
        const service = new EmbeddingService(llm);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] generating embedding for context...');
        const queryEmbedding = await service.generateEmbeddingWithTranslation(context);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] embedding result', { hasEmbedding: isDefined(queryEmbedding), length: queryEmbedding?.length });

        if (!isDefined(queryEmbedding)) {
            return [];
        }

        const serialized = serializeEmbedding(queryEmbedding);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] vec search', { serializedLength: serialized.length, limit: EMBEDDING_VEC_SEARCH_LIMIT });
        const results = await this.repository.findSimilarContexts(serialized, EMBEDDING_VEC_SEARCH_LIMIT);

        // eslint-disable-next-line no-console
        console.log('[EmbeddingSuggestion] vec results', { count: results.length, first: results.slice(0, 2) });

        return results.map(row => row.context);
    }
}
