import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_SEARCH_LIMIT
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { EmbeddingRepositoryInterface } from '../interface/embedding-repository.interface';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(private readonly repository: EmbeddingRepositoryInterface) {}

    async suggestCategories(context: string, llm: LlmInterface, categories: CategoryEntityInterface[]): Promise<CategoryEntityInterface[]> {
        const similarContexts = await this.findSimilarContexts(context, llm);

        if (!isNotEmptyArray(similarContexts)) {
            return [];
        }

        const categoryCounts = await this.repository.findCategoriesByContexts(similarContexts);

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
        const queryEmbedding = await service.generateEmbeddingWithTranslation(context);

        if (!isDefined(queryEmbedding)) {
            return [];
        }

        const serialized = serializeEmbedding(queryEmbedding);
        const results = await this.repository.findSimilarContexts(serialized, EMBEDDING_VEC_SEARCH_LIMIT);

        return results.map(row => row.context);
    }
}
