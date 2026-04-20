import {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface
} from '@budgie/contracts';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_COMMENT_SUGGESTION_LIMIT,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT,
    EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD
} from '../../@generic/constant/embedding.constant';
import { aiLog } from '../../@generic/util/ai-log.util';
import { serializeEmbedding } from '../../@generic/util/serialize-embedding.util';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';
import { EmbeddingSuggestionRepositoriesInterface } from '../interface/embedding-suggestion-repositories.interface';
import { PrepareSuggestionResultInterface } from '../interface/prepare-suggestion-result.interface';
import { SerializedEmbeddingResultInterface } from '../interface/serialized-embedding-result.interface';
import { SuggestionContextInterface } from '../interface/suggestion-context.interface';
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

export class EmbeddingSuggestionService {
    constructor(
        private readonly repositories: EmbeddingSuggestionRepositoriesInterface,
        private readonly embedding: EmbeddingInvokerInterface,
        private readonly getMccCategorySuggestions: (
            mccCategoryId: number,
            limit: number
        ) => Promise<{ categoryId: number; count: number }[]>
    ) {}

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit
    async suggestCategories(
        categories: CategoryEntityInterface[],
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string,
        mccCategoryId: number | null = null
    ): Promise<CategoryEntityInterface[]> {
        const preparation = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(preparation)) {
            return [];
        }
        const { resolved, methodStart } = preparation;

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

        aiLog('suggest:category:mcc-signal', { mccCategoryId, resultCount: mccRows.length, results: mccRows });

        const resolvedCategories = this.resolveTopCategories(categories, merchantResults, commentResults, mccRows);
        aiLog('suggest:category:final', {
            resolvedCount: resolvedCategories.length,
            topCategoryIds: resolvedCategories.map(category => category.id),
            totalDurationMs: Date.now() - methodStart
        });

        return resolvedCategories;
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit
    async suggestTags(
        allTags: TagEntityInterface[],
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<TagEntityInterface[]> {
        const preparation = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(preparation)) {
            return [];
        }
        const { resolved, methodStart } = preparation;

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
        const resolvedTags = topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);

        aiLog('suggest:tag:final', {
            topCount: topTags.length,
            resolvedCount: resolvedTags.length,
            topTagIds: resolvedTags.map(tag => tag.id),
            totalDurationMs: Date.now() - methodStart
        });

        return resolvedTags;
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Keep full context fields explicit
    async suggestComments(
        categoryId: number,
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<string[]> {
        const preparation = await this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(preparation)) {
            return [];
        }
        const { resolved, methodStart } = preparation;

        const commentResults = await this.repositories.merchant.findSimilarComments(resolved.serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        const finalComments = commentResults.map(row => row.comment).filter(isNotEmptyString);
        aiLog('suggest:comment:final', { count: finalComments.length, totalDurationMs: Date.now() - methodStart });

        return finalComments;
    }

    private async prepareSuggestion(
        transactionTitle: string,
        mccDescription: string | null,
        comment: string,
        aiContext: string
    ): Promise<PrepareSuggestionResultInterface | null> {
        const methodStart = Date.now();
        const suggestionContext = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const resolved = await this.resolveSerializedEmbedding(suggestionContext);

        if (!isDefined(resolved)) {
            return null;
        }

        return { resolved, methodStart };
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
        const mccBlendWeight = 0.7;
        const mccMaxCount = Math.max(...mccRows.map(row => row.count));
        for (const { categoryId, count } of mccRows) {
            const mccNormalizedScore = (count / mccMaxCount) * mccBlendWeight;
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

    private async generateSerializedEmbedding(context: string): Promise<Uint8Array | null> {
        const service = new EmbeddingService(this.embedding);
        const queryEmbedding = await service.generateEmbedding(context);

        if (!isDefined(queryEmbedding) || queryEmbedding.length === 0) {
            aiLog('suggest:embed:empty', { context });

            return null;
        }

        return serializeEmbedding(queryEmbedding);
    }
}
