import { CategoryEntityInterface, TagEntityInterface, TitleEmbeddingEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_SIMILARITY_THRESHOLD,
    EMBEDDING_TAG_SUGGESTION_LIMIT
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { cosineSimilarity } from '../../@generic/util/cosine-similarity.util';
import { deserializeEmbedding } from '../../@generic/util/deserialize-embedding.util';
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
        const queryEmbedding = await service.generateEmbedding(context);

        if (!isDefined(queryEmbedding)) {
            return [];
        }

        const allEmbeddings = await this.repository.findAll();

        if (!isNotEmptyArray(allEmbeddings)) {
            return [];
        }

        return this.collectSimilarContexts(queryEmbedding, allEmbeddings);
    }

    private collectSimilarContexts(queryEmbedding: Float32Array, allEmbeddings: TitleEmbeddingEntityInterface[]): string[] {
        const similarContexts: string[] = [];

        for (const row of allEmbeddings) {
            const rowEmbedding = deserializeEmbedding(row.embedding);
            const similarity = cosineSimilarity(queryEmbedding, rowEmbedding);

            if (similarity >= EMBEDDING_SIMILARITY_THRESHOLD) {
                similarContexts.push(row.context);
            }
        }

        return similarContexts;
    }
}
