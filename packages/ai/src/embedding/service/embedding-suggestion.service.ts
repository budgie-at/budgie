import {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_COMMENT_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT,
    EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD
} from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { EmbeddingSuggestionRepositoriesInterface } from '../interface/embedding-suggestion-repositories.interface';
import { SuggestionContextInterface } from '../interface/suggestion-context.interface';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(private readonly repositories: EmbeddingSuggestionRepositoriesInterface) {}

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestCategories(
        llm: LlmInterface,
        categories: CategoryEntityInterface[],
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<CategoryEntityInterface[]> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }

        const [merchantResults, commentResults] = await Promise.all([
            this.repositories.merchant.findSimilarCategories(
                serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            ),
            this.repositories.comment.findSimilarCategories(
                serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            )
        ]);

        const merged = this.mergeCategoryScores(merchantResults, commentResults);
        const topCategories = merged.slice(0, EMBEDDING_CATEGORY_SUGGESTION_LIMIT);

        return topCategories.map(row => categories.find(category => category.id === row.categoryId)).filter(isDefined);
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestTags(
        llm: LlmInterface,
        allTags: TagEntityInterface[],
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<TagEntityInterface[]> {
        /* jscpd:ignore-start */
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }
        /* jscpd:ignore-end */

        const tagParams: SimilarTagsParamsInterface = {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold,
            categoryId,
            tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
        };

        const [merchantResults, commentResults] = await Promise.all([
            this.repositories.merchant.findSimilarTags(serialized, tagParams),
            this.repositories.comment.findSimilarTags(serialized, tagParams)
        ]);

        const merged = this.mergeTagScores(merchantResults, commentResults);
        const topTags = merged.slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);

        return topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit to avoid extra context-building calls in hooks
    async suggestComments(
        llm: LlmInterface,
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<string[]> {
        /* jscpd:ignore-start */
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const { context, distanceThreshold } = suggestionContext;
        const serialized = await this.generateSerializedEmbedding(context, llm);

        if (!isDefined(serialized)) {
            return [];
        }
        /* jscpd:ignore-end */

        const commentResults = await this.repositories.merchant.findSimilarComments(serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        return commentResults.map(row => row.comment).filter(isNotEmptyString);
    }

    private resolveSuggestionContext(
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): SuggestionContextInterface {
        const hasVoiceContext = isNotEmptyString(aiContext);
        const context = hasVoiceContext ? aiContext : buildTransactionContext({ title: transactionTitle, mccDescription, comment });
        const distanceThreshold = hasVoiceContext ? EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD : EMBEDDING_VEC_DISTANCE_THRESHOLD;

        return { context, distanceThreshold };
    }

    private mergeCategoryScores(
        merchantResults: CategoryScoreResultInterface[],
        commentResults: CategoryScoreResultInterface[]
    ): CategoryScoreResultInterface[] {
        const scoreMap = new Map<number, number>();

        for (const row of merchantResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        for (const row of commentResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        return [...scoreMap.entries()]
            .map(([categoryId, score]) => ({ categoryId, score }))
            .sort((first, second) => second.score - first.score);
    }

    private mergeTagScores(
        merchantResults: TagScoreResultInterface[],
        commentResults: TagScoreResultInterface[]
    ): TagScoreResultInterface[] {
        const scoreMap = new Map<number, number>();

        for (const row of merchantResults) {
            scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
        }

        for (const row of commentResults) {
            scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
        }

        return [...scoreMap.entries()].map(([tagId, score]) => ({ tagId, score })).sort((first, second) => second.score - first.score);
    }

    private async generateSerializedEmbedding(context: string, llm: LlmInterface): Promise<Uint8Array | null> {
        const service = new EmbeddingService(llm);
        const queryEmbedding = await service.generateEmbedding(context);

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }
}
