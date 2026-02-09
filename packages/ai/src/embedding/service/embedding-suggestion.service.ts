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
        const start = performance.now();
        console.log(`[EmbedSuggest] suggestCategories START context="${context}"`); // eslint-disable-line no-console
        const serialized = await this.generateSerializedEmbedding(context, llm);
        console.log(`[EmbedSuggest] embedding generated in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console

        if (!isDefined(serialized)) {
            return [];
        }

        const categoryCounts = await this.repository.findSimilarCategories(
            serialized,
            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            EMBEDDING_VEC_DISTANCE_THRESHOLD,
            EMBEDDING_CATEGORY_SUGGESTION_LIMIT
        );
        // eslint-disable-next-line no-console
        console.log(`[EmbedSuggest] suggestCategories in ${(performance.now() - start).toFixed(0)}ms n=${categoryCounts.length}`);

        return categoryCounts.map(row => categories.find(category => category.id === row.categoryId)).filter(isDefined);
    }

    async suggestTags(context: string, llm: LlmInterface, allTags: TagEntityInterface[]): Promise<TagEntityInterface[]> {
        const start = performance.now();
        console.log(`[EmbedSuggest] suggestTags START context="${context}"`); // eslint-disable-line no-console
        const serialized = await this.generateSerializedEmbedding(context, llm);
        console.log(`[EmbedSuggest] tag embedding generated in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console

        if (!isDefined(serialized)) {
            return [];
        }

        const tagCounts = await this.repository.findSimilarTags(
            serialized,
            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            EMBEDDING_VEC_DISTANCE_THRESHOLD,
            EMBEDDING_TAG_SUGGESTION_LIMIT
        );
        console.log(`[EmbedSuggest] suggestTags done in ${(performance.now() - start).toFixed(0)}ms, results=${tagCounts.length}`); // eslint-disable-line no-console

        return tagCounts.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    }

    private async generateSerializedEmbedding(context: string, llm: LlmInterface): Promise<Uint8Array | null> {
        const start = performance.now();
        const service = new EmbeddingService(llm);
        const queryEmbedding = await service.generateEmbeddingWithTranslation(context);
        console.log(`[EmbedSuggest] generateSerializedEmbedding done in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }
}
