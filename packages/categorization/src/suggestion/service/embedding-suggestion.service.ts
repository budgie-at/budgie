import { TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import {
    EMBEDDING_CATEGORY_SUGGESTION_LIMIT,
    EMBEDDING_COMMENT_SUGGESTION_LIMIT,
    EMBEDDING_QUERY_PREFIX,
    EMBEDDING_TAG_SUGGESTION_LIMIT,
    EMBEDDING_VEC_DISTANCE_THRESHOLD,
    EMBEDDING_CROSS_CATEGORY_TAG_DISTANCE_THRESHOLD,
    EMBEDDING_VEC_OVERSAMPLE_LIMIT,
    EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD
} from '../../embedding/constant/embedding.constant';
import { CommentEmbeddingRepository } from '../../embedding/repository/comment-embedding.repository';
import { MerchantEmbeddingRepository } from '../../embedding/repository/merchant-embedding.repository';
import { EmbeddingService } from '../../embedding/service/embedding.service';
import { buildTransactionContext } from '../../embedding/util/build-transaction-context.util';
import { serializeEmbedding } from '../../embedding/util/serialize-embedding.util';

import type { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';

export class EmbeddingSuggestionService extends Context.Service<EmbeddingSuggestionService>()(
    '@budgie/categorization/EmbeddingSuggestionService',
    {
        make: Effect.gen(function* () {
            const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
            const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
            const transactionRepository = yield* TransactionRepository;
            const embeddingService = yield* EmbeddingService;

            const MCC_BLEND_WEIGHT = 7 / 10;

            const addScores = (scores: Map<number, number>, entries: Iterable<readonly [number, number]>): Map<number, number> => {
                for (const [id, score] of entries) {
                    scores.set(id, (scores.get(id) ?? 0) + score);
                }

                return scores;
            };

            const rankIds = (scores: ReadonlyMap<number, number>, limit: number): number[] =>
                [...scores]
                    .sort(([, first], [, second]) => second - first)
                    .slice(0, limit)
                    .map(([id]) => id);

            const prepareSuggestion = Effect.fn('EmbeddingSuggestionService.prepareSuggestion')(function* (
                transactionTitle: string,
                mccDescription: string | null,
                comment: string,
                aiContext: string
            ) {
                const hasVoiceContext = isNotEmptyString(aiContext);
                const context = hasVoiceContext ? aiContext : buildTransactionContext(transactionTitle, mccDescription, comment);
                const queryEmbedding = yield* embeddingService.generateEmbedding(`${EMBEDDING_QUERY_PREFIX}${context}`);

                if (!isDefined(queryEmbedding) || !isPositiveNumber(queryEmbedding.length)) {
                    return null;
                }

                return {
                    serialized: serializeEmbedding(queryEmbedding),
                    distanceThreshold: hasVoiceContext ? EMBEDDING_VEC_VOICE_DISTANCE_THRESHOLD : EMBEDDING_VEC_DISTANCE_THRESHOLD
                };
            });

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

                const { serialized, distanceThreshold } = resolved;
                const [merchantResults, commentResults, mccRows] = yield* Effect.all(
                    [
                        merchantEmbeddingRepository.findSimilarCategories(
                            serialized,
                            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                            distanceThreshold,
                            EMBEDDING_CATEGORY_SUGGESTION_LIMIT
                        ),
                        commentEmbeddingRepository.findSimilarCategories(
                            serialized,
                            EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                            distanceThreshold,
                            EMBEDDING_CATEGORY_SUGGESTION_LIMIT
                        ),
                        isDefined(mccCategoryId)
                            ? transactionRepository.findMccCategorySuggestions(mccCategoryId, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
                            : Effect.succeed([])
                    ],
                    { concurrency: 'unbounded' }
                );
                const mccMaxCount = Math.max(...mccRows.map(row => row.count));
                const scores = new Map<number, number>();

                addScores(
                    scores,
                    merchantResults.map(row => [row.categoryId, row.score])
                );
                addScores(
                    scores,
                    commentResults.map(row => [row.categoryId, row.score])
                );
                addScores(
                    scores,
                    mccRows.map(row => [row.categoryId, (row.count / mccMaxCount) * MCC_BLEND_WEIGHT])
                );

                return rankIds(scores, EMBEDDING_CATEGORY_SUGGESTION_LIMIT)
                    .map(categoryId => categories.find(category => category.id === categoryId))
                    .filter(isDefined);
            });

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

                const findTagScores = (tagCategoryId: number | null, distanceThreshold: number) => {
                    const tagParams = {
                        vecLimit: EMBEDDING_VEC_OVERSAMPLE_LIMIT,
                        distanceThreshold,
                        categoryId: tagCategoryId,
                        tagLimit: EMBEDDING_TAG_SUGGESTION_LIMIT
                    };

                    return Effect.map(
                        Effect.all(
                            [
                                merchantEmbeddingRepository.findSimilarTags(resolved.serialized, tagParams),
                                commentEmbeddingRepository.findSimilarTags(resolved.serialized, tagParams)
                            ],
                            { concurrency: 'unbounded' }
                        ),
                        results =>
                            rankIds(
                                addScores(
                                    new Map<number, number>(),
                                    results.flat().map(row => [row.tagId, row.score])
                                ),
                                EMBEDDING_TAG_SUGGESTION_LIMIT
                            )
                    );
                };
                const [categoryTagIds, nearTagIds] = yield* Effect.all([
                    findTagScores(categoryId, resolved.distanceThreshold),
                    findTagScores(null, EMBEDDING_CROSS_CATEGORY_TAG_DISTANCE_THRESHOLD)
                ]);

                return [...new Set([...categoryTagIds, ...nearTagIds])]
                    .slice(0, EMBEDDING_TAG_SUGGESTION_LIMIT)
                    .map(tagId => allTags.find(tag => tag.id === tagId))
                    .filter(isDefined);
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
    }
) {
    static readonly layer = Layer.effect(EmbeddingSuggestionService, EmbeddingSuggestionService.make).pipe(
        Layer.provide([
            MerchantEmbeddingRepository.layer,
            CommentEmbeddingRepository.layer,
            TransactionRepository.layer,
            EmbeddingService.layer
        ])
    );
}
