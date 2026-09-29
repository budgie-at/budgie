import * as Effect from 'effect/Effect';

import { isDefined, isEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

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

import type { SuggestionContextInterface } from '../interface/suggestion-context.interface';
import type {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface,
    TransactionRepository
} from '@budgie/contracts';

export class EmbeddingSuggestionService {
    private static readonly MCC_BLEND_WEIGHT = 7 / 10;

    readonly suggestCategories = Effect.fn('EmbeddingSuggestionService.suggestCategories')(function* (
        this: EmbeddingSuggestionService,
        ...[categories, transactionTitle, mccDescription, comment, aiContext, mccCategoryId = null]: [
            CategoryEntityInterface[],
            string,
            string | null,
            string,
            string,
            (number | null)?
        ]
    ) {
        const resolved = yield* this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const [merchantResults, commentResults, mccRows] = yield* Effect.all(
            [
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
                isDefined(mccCategoryId)
                    ? this.getMccCategorySuggestions(mccCategoryId, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
                    : Effect.succeed([])
            ],
            { concurrency: 'unbounded' }
        );

        return this.resolveTopCategories(categories, merchantResults, commentResults, mccRows);
    });

    readonly suggestTags = Effect.fn('EmbeddingSuggestionService.suggestTags')(function* (
        this: EmbeddingSuggestionService,
        ...[allTags, categoryId, transactionTitle, mccDescription, comment, aiContext]: [
            TagEntityInterface[],
            number,
            string,
            string | null,
            string,
            string
        ]
    ) {
        const resolved = yield* this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const tagParams: SimilarTagsParamsInterface = {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
        };

        const [merchantResults, commentResults] = yield* Effect.all(
            [
                this.repositories.merchant.findSimilarTags(resolved.serialized, tagParams),
                this.repositories.comment.findSimilarTags(resolved.serialized, tagParams)
            ],
            { concurrency: 'unbounded' }
        );

        const merged = this.mergeTagScores(merchantResults, commentResults);
        const topTags = merged.slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);

        return topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
    });

    readonly suggestComments = Effect.fn('EmbeddingSuggestionService.suggestComments')(function* (
        this: EmbeddingSuggestionService,
        ...[categoryId, transactionTitle, mccDescription, comment, aiContext]: [number, string, string | null, string, string]
    ) {
        const resolved = yield* this.prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
        if (!isDefined(resolved)) {
            return [];
        }

        const commentResults = yield* this.repositories.merchant.findSimilarComments(resolved.serialized, {
            vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
            distanceThreshold: resolved.distanceThreshold,
            categoryId,
            commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
        });

        return commentResults.map(row => row.comment).filter(isNotEmptyString);
    });

    private readonly prepareSuggestion = Effect.fn('EmbeddingSuggestionService.prepareSuggestion')(function* (
        this: EmbeddingSuggestionService,
        ...[transactionTitle, mccDescription, comment, aiContext]: [string, string | null, string, string]
    ) {
        const { context, distanceThreshold } = this.resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
        const queryEmbedding = yield* this.embeddingService.generateEmbedding(context);

        if (!isDefined(queryEmbedding) || !isPositiveNumber(queryEmbedding.length)) {
            return null;
        }

        return { serialized: serializeEmbedding(queryEmbedding), distanceThreshold };
    });

    private readonly embeddingService: EmbeddingService;

    constructor(
        private readonly repositories: EmbeddingSuggestionRepositoriesInterface,
        embedding: EmbeddingInvokerInterface,
        private readonly getMccCategorySuggestions: TransactionRepository['findMccCategorySuggestions']
    ) {
        this.embeddingService = new EmbeddingService(embedding);
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
