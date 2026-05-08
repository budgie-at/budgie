/* eslint-disable @typescript-eslint/max-params -- Existing suggestion APIs and Log hooks intentionally keep positional arguments */
import {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_COMMENT_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT,
    EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD
} from '../../@generic/constant/embedding.constant';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';
import { EmbeddingSuggestionRepositoriesInterface } from '../interface/embedding-suggestion-repositories.interface';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

import type { SerializedEmbeddingResultInterface } from '../interface/serialized-embedding-result.interface';
import type { SuggestionContextInterface } from '../interface/suggestion-context.interface';

export class EmbeddingSuggestionService {
    private static readonly MCC_BLEND_WEIGHT = 7 / 10;

    constructor(
        private readonly repositories: EmbeddingSuggestionRepositoriesInterface,
        private readonly embedding: EmbeddingInvokerInterface,
        private readonly getMccCategorySuggestions: (
            mccCategoryId: number,
            limit: number
        ) => Promise<{ categoryId: number; count: number }[]>
    ) {}

    @Log(
        (categories, transactionTitle, mccDescription, comment, aiContext, mccCategoryId) =>
            `enter title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" mccCategoryId=${String(mccCategoryId)} categoryIds=${categories.map(category => category.id).join(',')}`,
        (result, categories, transactionTitle, mccDescription, comment, aiContext, mccCategoryId) =>
            `done title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" mccCategoryId=${String(mccCategoryId)} categoryCount=${categories.length} resolvedIds=${result.map(category => category.id).join(',')}`,
        (error, categories, transactionTitle, mccDescription, comment, aiContext, mccCategoryId) =>
            `throw title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" mccCategoryId=${String(mccCategoryId)} categoryCount=${categories.length} error=${getErrorMessage(error)}`
    )
    async suggestCategories(
        categories: CategoryEntityInterface[],
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string,
        mccCategoryId: number | null = null
    ): Promise<CategoryEntityInterface[]> {
        const resolved = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const mccLookup = isDefined(mccCategoryId)
            ? this.getMccCategorySuggestions(mccCategoryId, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
            : Promise.resolve([]);

        const [merchantResults, commentResults, mccRows] = await Promise.all([
            this.repositories.merchant.findSimilarCategories(
                resolved.serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                resolved.distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            ),
            this.repositories.comment.findSimilarCategories(
                resolved.serialized,
                EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                resolved.distanceThreshold,
                EMBEDDING_CATEGORY_SUGGESTION_LIMIT
            ),
            mccLookup
        ]);

        return this.resolveTopCategories(categories, merchantResults, commentResults, mccRows);
    }

    @Log(
        (allTags, categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `enter title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" categoryId=${categoryId} tagIds=${allTags.map(tag => tag.id).join(',')}`,
        (result, allTags, categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `done title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" categoryId=${categoryId} tagCount=${allTags.length} resolvedIds=${result.map(tag => tag.id).join(',')}`,
        (error, allTags, categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `throw title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" categoryId=${categoryId} tagCount=${allTags.length} error=${getErrorMessage(error)}`
    )
    async suggestTags(
        allTags: TagEntityInterface[],
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<TagEntityInterface[]> {
        const resolved = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const tagParams: SimilarTagsParamsInterface = {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
        };

        const [merchantResults, commentResults] = await Promise.all([
            this.repositories.merchant.findSimilarTags(resolved.serialized, tagParams),
            this.repositories.comment.findSimilarTags(resolved.serialized, tagParams)
        ]);

        const merged = this.mergeTagScores(merchantResults, commentResults);
        const topTags = merged.slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);

        return topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    }

    @Log(
        (categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `enter categoryId=${categoryId} title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}"`,
        (result, categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `done categoryId=${categoryId} title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" count=${result.length}`,
        (error, categoryId, transactionTitle, mccDescription, comment, aiContext) =>
            `throw categoryId=${categoryId} title="${transactionTitle}" mcc="${mccDescription ?? 'none'}" comment="${comment}" aiContext="${aiContext}" error=${getErrorMessage(error)}`
    )
    async suggestComments(
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<string[]> {
        const resolved = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const commentResults = await this.repositories.merchant.findSimilarComments(resolved.serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        return commentResults.map(row => row.comment).filter(isNotEmptyString);
    }

    @Log(
        context => `enter context="${context}"`,
        (result, context) => `done context="${context}" resolved=${String(isDefined(result))}`,
        (error, context) => `throw context="${context}" error=${getErrorMessage(error)}`
    )
    private async generateSerializedEmbedding(context: string): Promise<Uint8Array | null> {
        const service = new EmbeddingService(this.embedding);
        const queryEmbedding = await service.generateEmbedding(context);

        // eslint-disable-next-line no-restricted-syntax -- Float32Array; isEmptyArray uses Array.isArray which is false for typed arrays
        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }

    private async prepareSuggestion(
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<SerializedEmbeddingResultInterface | null> {
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);

        return this.resolveSerializedEmbedding(suggestionContext);
    }

    private async resolveSerializedEmbedding(
        suggestionContext: SuggestionContextInterface
    ): Promise<SerializedEmbeddingResultInterface | null> {
        const serialized = await this.generateSerializedEmbedding(suggestionContext.context);

        if (!isDefined(serialized)) {
            return null;
        }

        return { serialized, distanceThreshold: suggestionContext.distanceThreshold };
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

    private buildCategoryScoreMap(
        merchantResults: CategoryScoreResultInterface[],
        commentResults: CategoryScoreResultInterface[]
    ): Map<number, number> {
        const scoreMap = new Map<number, number>();

        for (const row of merchantResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        for (const row of commentResults) {
            scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
        }

        return scoreMap;
    }

    private resolveTopCategories(
        categories: CategoryEntityInterface[],
        merchantResults: CategoryScoreResultInterface[],
        commentResults: CategoryScoreResultInterface[],
        mccRows: { categoryId: number; count: number }[]
    ): CategoryEntityInterface[] {
        const scoreMap = this.buildCategoryScoreMap(merchantResults, commentResults);
        this.blendMccScores(scoreMap, mccRows);
        const sorted = [...scoreMap.entries()]
            .map(([categoryId, score]) => ({ categoryId, score }))
            .sort((first, second) => second.score - first.score);

        return sorted
            .slice(0, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
            .map(row => categories.find(category => category.id === row.categoryId))
            .filter(isDefined);
    }

    private blendMccScores(scoreMap: Map<number, number>, mccRows: { categoryId: number; count: number }[]): void {
        if (isEmptyArray(mccRows)) {
            return;
        }
        const mccMaxCount = Math.max(...mccRows.map(row => row.count));
        for (const { categoryId, count } of mccRows) {
            const mccNormalizedScore = (count / mccMaxCount) * EmbeddingSuggestionService.MCC_BLEND_WEIGHT;
            scoreMap.set(categoryId, (scoreMap.get(categoryId) ?? 0) + mccNormalizedScore);
        }
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
}
