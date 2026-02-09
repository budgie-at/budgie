import { CategoryEntityInterface, TagEntityInterface, TitleEmbeddingRepository } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(private readonly repository: TitleEmbeddingRepository) {}

    async suggestCategories(context: string, llm: LlmInterface, categories: CategoryEntityInterface[]): Promise<CategoryEntityInterface[]> {
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }

        const categoryCounts = await this.repository.findSimilarCategories(
            serialized,
            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            EMBEDDING_VEC_DISTANCE_THRESHOLD,
            EMBEDDING_CATEGORY_SUGGESTION_LIMIT
        );

        return categoryCounts.map(row => categories.find(category => category.id === row.categoryId)).filter(isDefined);
    }

    async suggestTags(context: string, llm: LlmInterface, allTags: TagEntityInterface[]): Promise<TagEntityInterface[]> {
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }

        const tagCounts = await this.repository.findSimilarTags(
            serialized,
            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            EMBEDDING_VEC_DISTANCE_THRESHOLD,
            EMBEDDING_TAG_SUGGESTION_LIMIT
        );

        return tagCounts.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    }

    private async generateSerializedEmbedding(context: string, llm: LlmInterface): Promise<Uint8Array | null> {
        const service = new EmbeddingService(llm);
        const queryEmbedding = await service.generateEmbeddingWithTranslation(context);

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }
}
