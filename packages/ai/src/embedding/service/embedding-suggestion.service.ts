import { CommentEmbeddingRepository, MerchantEmbeddingRepository, TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

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
import { buildTransactionContext } from '../util/build-transaction-context.util';

import { EmbeddingService } from './embedding.service';

import type { SuggestionContextInterface } from '../interface/suggestion-context.interface';
import type {
    CategoryEntityInterface,
    CategoryScoreResultInterface,
    SimilarTagsParamsInterface,
    TagEntityInterface,
    TagScoreResultInterface
} from '@budgie/contracts';

export class EmbeddingSuggestionService extends Context.Service<EmbeddingSuggestionService>()('@budgie/ai/EmbeddingSuggestionService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;

        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;

        const transactionRepository = yield* TransactionRepository;

        const embeddingService = yield* EmbeddingService;

        const MCC_BLEND_WEIGHT = 7 / 10;

        const resolveSuggestionContext = (
            transactionTitle: string,
            mccDescription: string | null,
            comment: string,
            aiContext: string
        ): SuggestionContextInterface => {
            const hasVoiceContext = isNotEmptyString(aiContext);
            const context = hasVoiceContext ? aiContext : buildTransactionContext({ title: transactionTitle, mccDescription, comment });
            const distanceThreshold = hasVoiceContext ? EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD : EMBEDDING_VEC_DISTANCE_THRESHOLD;

            return { context, distanceThreshold };
        };

        const prepareSuggestion = Effect.fn('EmbeddingSuggestionService.prepareSuggestion')(function* (
            transactionTitle: string,
            mccDescription: string | null,
            comment: string,
            aiContext: string
        ) {
            const { context, distanceThreshold } = resolveSuggestionContext(transactionTitle, mccDescription, comment, aiContext);
            const queryEmbedding = yield* embeddingService.generateEmbedding(context);

            if (!isDefined(queryEmbedding) || !isPositiveNumber(queryEmbedding.length)) {
                return null;
            }

            return { serialized: serializeEmbedding(queryEmbedding), distanceThreshold };
        });

        const buildCategoryScoreMap = (
            merchantResults: CategoryScoreResultInterface[],
            commentResults: CategoryScoreResultInterface[]
        ): Map<number, number> => {
            const scoreMap = new Map<number, number>();

            for (const row of merchantResults) {
                scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
            }

            for (const row of commentResults) {
                scoreMap.set(row.categoryId, (scoreMap.get(row.categoryId) ?? 0) + row.score);
            }

            return scoreMap;
        };

        const blendMccScores = (scoreMap: Map<number, number>, mccRows: { categoryId: number; count: number }[]): void => {
            if (isEmptyArray(mccRows)) {
                return;
            }
            const mccMaxCount = Math.max(...mccRows.map(row => row.count));
            for (const { categoryId, count } of mccRows) {
                const mccNormalizedScore = (count / mccMaxCount) * MCC_BLEND_WEIGHT;
                scoreMap.set(categoryId, (scoreMap.get(categoryId) ?? 0) + mccNormalizedScore);
            }
        };

        const resolveTopCategories = (
            categories: CategoryEntityInterface[],
            merchantResults: CategoryScoreResultInterface[],
            commentResults: CategoryScoreResultInterface[],
            mccRows: { categoryId: number; count: number }[]
        ): CategoryEntityInterface[] => {
            const scoreMap = buildCategoryScoreMap(merchantResults, commentResults);
            blendMccScores(scoreMap, mccRows);
            const sorted = [...scoreMap.entries()]
                .map(([categoryId, score]) => ({ categoryId, score }))
                .sort((first, second) => second.score - first.score);

            return sorted
                .slice(0, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
                .map(row => categories.find(category => category.id === row.categoryId))
                .filter(isDefined);
        };

        // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
        const suggestCategories = Effect.fn('EmbeddingSuggestionService.suggestCategories')(function* (
            categories: CategoryEntityInterface[],
            transactionTitle: string,
            mccDescription: string | null,
            comment: string,
            aiContext: string,
            mccCategoryId: number | null = null
        ) {
            const resolved = yield* prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
            if (!isDefined(resolved)) {
                return [];
            }

            const [merchantResults, commentResults, mccRows] = yield* Effect.all(
                [
                    merchantEmbeddingRepository.findSimilarCategories(
                        resolved.serialized,
                        EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                        resolved.distanceThreshold,
                        EMBEDDING_CATEGORY_SUGGESTION_LIMIT
                    ),
                    commentEmbeddingRepository.findSimilarCategories(
                        resolved.serialized,
                        EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                        resolved.distanceThreshold,
                        EMBEDDING_CATEGORY_SUGGESTION_LIMIT
                    ),
                    isDefined(mccCategoryId)
                        ? transactionRepository.findMccCategorySuggestions(mccCategoryId, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
                        : Effect.succeed([])
                ],
                { concurrency: 'unbounded' }
            );

            return resolveTopCategories(categories, merchantResults, commentResults, mccRows);
        });

        const mergeTagScores = (
            merchantResults: TagScoreResultInterface[],
            commentResults: TagScoreResultInterface[]
        ): TagScoreResultInterface[] => {
            const scoreMap = new Map<number, number>();

            for (const row of merchantResults) {
                scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
            }

            for (const row of commentResults) {
                scoreMap.set(row.tagId, (scoreMap.get(row.tagId) ?? 0) + row.score);
            }

            return [...scoreMap.entries()].map(([tagId, score]) => ({ tagId, score })).sort((first, second) => second.score - first.score);
        };

        // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
        const suggestTags = Effect.fn('EmbeddingSuggestionService.suggestTags')(function* (
            allTags: TagEntityInterface[],
            categoryId: number,
            transactionTitle: string,
            mccDescription: string | null,
            comment: string,
            aiContext: string
        ) {
            const resolved = yield* prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);

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
                    merchantEmbeddingRepository.findSimilarTags(resolved.serialized, tagParams),
                    commentEmbeddingRepository.findSimilarTags(resolved.serialized, tagParams)
                ],
                { concurrency: 'unbounded' }
            );

            const merged = mergeTagScores(merchantResults, commentResults);
            const topTags = merged.slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT);

            return topTags.map(row => allTags.find(tag => tag.id === row.tagId)).filter(isDefined);
        });

        // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
        const suggestComments = Effect.fn('EmbeddingSuggestionService.suggestComments')(function* (
            categoryId: number,
            transactionTitle: string,
            mccDescription: string | null,
            comment: string,
            aiContext: string
        ) {
            const resolved = yield* prepareSuggestion(transactionTitle, mccDescription, comment, aiContext);
            const commentResults = isDefined(resolved)
                ? yield* merchantEmbeddingRepository.findSimilarComments(resolved.serialized, {
                      vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                      distanceThreshold: resolved.distanceThreshold,
                      categoryId,
                      commentLimit: EMBEDDING_COMMENT_SUGGESTION_LIMIT
                  })
                : [];

            return commentResults.map(row => row.comment).filter(isNotEmptyString);
        });

        return { suggestCategories, suggestTags, suggestComments };
    })
}) {
    static readonly layer = Layer.effect(EmbeddingSuggestionService, EmbeddingSuggestionService.make).pipe(
        Layer.provide([
            MerchantEmbeddingRepository.layer,
            CommentEmbeddingRepository.layer,
            TransactionRepository.layer,
            EmbeddingService.layer
        ])
    );
}
