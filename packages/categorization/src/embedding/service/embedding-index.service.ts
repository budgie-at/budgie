import { CategorySourceEnum, Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionCategorizeInboxRepository } from '../../inbox/repository/transaction-categorize-inbox.repository';
import { EmbeddingSuggestionService } from '../../suggestion/service/embedding-suggestion.service';
import {
    EMBEDDING_AUTO_APPLY_DISTANCE_THRESHOLD,
    EMBEDDING_AUTO_APPLY_MIN_CONFIDENCE,
    EMBEDDING_DOCUMENT_PREFIX,
    EMBEDDING_QUERY_PREFIX
} from '../constant/embedding.constant';
import { CommentEmbeddingRepository } from '../repository/comment-embedding.repository';
import { MerchantEmbeddingRepository } from '../repository/merchant-embedding.repository';
import { TransactionEmbeddingRepository } from '../repository/transaction-embedding.repository';
import { buildCommentContext } from '../util/build-comment-context.util';
import { buildMerchantContext } from '../util/build-merchant-context.util';
import { buildTransactionContext } from '../util/build-transaction-context.util';
import { serializeEmbedding } from '../util/serialize-embedding.util';

import { EmbeddingInvoker } from './embedding-invoker.service';
import { EmbeddingService } from './embedding.service';

import type { AutoCategoryCandidateInterface } from '../interface/auto-category-candidate.interface';
import type { EmbeddingIndexSourceInterface } from '../interface/embedding-index-source.interface';
import type { EmbeddingPendingContextBaseInterface } from '../interface/embedding-pending-context-base.interface';

export class EmbeddingIndexService extends Context.Service<EmbeddingIndexService>()('@budgie/categorization/EmbeddingIndexService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;
        const embeddingInvoker = yield* EmbeddingInvoker;
        const embeddingService = yield* EmbeddingService;
        const embeddingSuggestionService = yield* EmbeddingSuggestionService;

        const predictCategory = Effect.fnUntraced(function* (embedding: Uint8Array) {
            const scores = yield* embeddingSuggestionService.scoreCategories(embedding, EMBEDDING_AUTO_APPLY_DISTANCE_THRESHOLD);

            const [best] = [...scores].sort(([, first], [, second]) => second - first);
            const total = [...scores.values()].reduce((sum, score) => sum + score, 0);

            return isDefined(best) && best[1] / total >= EMBEDDING_AUTO_APPLY_MIN_CONFIDENCE ? best[0] : null;
        });

        const autoCategorize = Effect.fnUntraced(function* (transaction: AutoCategoryCandidateInterface) {
            const queryEmbedding = yield* embeddingService.generateEmbedding(
                `${EMBEDDING_QUERY_PREFIX}${buildTransactionContext(transaction.title, transaction.mccDescription, transaction.comment)}`
            );
            const categoryId = isDefined(queryEmbedding) ? yield* predictCategory(serializeEmbedding(queryEmbedding)) : null;

            if (isDefined(categoryId)) {
                yield* transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
                    [transaction.transactionId],
                    categoryId,
                    CategorySourceEnum.AI
                );

                return;
            }

            yield* transactionEmbeddingRepository.clearNeedsEmbedding([transaction.transactionId]);
        });

        const makeIndex = <TContext extends EmbeddingPendingContextBaseInterface>(source: EmbeddingIndexSourceInterface<TContext>) => {
            const embeddedContexts: (readonly [number, TContext])[] = [];

            const indexContext = Effect.fnUntraced(function* (context: TContext) {
                const embeddingId = isDefined(context.existingEmbeddingId)
                    ? context.existingEmbeddingId
                    : yield* embeddingInvoker
                          .embed(`${EMBEDDING_DOCUMENT_PREFIX}${source.buildPrompt(context)}`)
                          .pipe(
                              Effect.flatMap(rawEmbedding =>
                                  isNotEmptyArray(rawEmbedding)
                                      ? source.upsert(context, serializeEmbedding(new Float32Array(rawEmbedding)), rawEmbedding.length)
                                      : Effect.succeed(null)
                              )
                          );

                if (isDefined(embeddingId)) {
                    embeddedContexts.push([embeddingId, context]);
                }
            });

            return {
                countPending: source.countPending,
                next: (limit: number) => Effect.map(source.fetchPending(limit), contexts => contexts.map(indexContext)),
                flush: Effect.suspend(() => {
                    const batch = embeddedContexts.splice(0);

                    return isEmptyArray(batch)
                        ? Effect.void
                        : Db.transaction(
                              Effect.forEach(batch, ([embeddingId, context]) => source.replaceTags(embeddingId, context.tagIds), {
                                  discard: true
                              }).pipe(
                                  Effect.andThen(
                                      transactionEmbeddingRepository.clearNeedsEmbedding(
                                          batch.flatMap(([, context]) => context.transactionIds)
                                      )
                                  )
                              )
                          );
                })
            };
        };

        const merchant = makeIndex({
            fetchPending: limit => merchantEmbeddingRepository.findPendingMerchantContexts(limit),
            countPending: merchantEmbeddingRepository.countPendingMerchantContexts(),
            buildPrompt: context => buildMerchantContext(context.title, context.mccDescription),
            upsert: (context, embedding, dimensions) =>
                merchantEmbeddingRepository.upsert({
                    title: context.title,
                    mccDescription: context.mccDescription,
                    categoryId: context.categoryId,
                    comment: context.comment,
                    embedding,
                    dimensions
                }),
            replaceTags: (embeddingId, tagIds) => merchantEmbeddingRepository.replaceTags(embeddingId, tagIds)
        });

        return {
            merchant: {
                ...merchant,
                countPending: Effect.zipWith(
                    merchant.countPending,
                    transactionEmbeddingRepository.countAwaitingAutoCategory(),
                    (contexts, transactions) => contexts + transactions
                ),
                next: (limit: number) =>
                    Effect.zipWith(
                        transactionEmbeddingRepository.findAwaitingAutoCategory(limit),
                        merchant.next(limit),
                        (transactions, contexts) => [...transactions.map(autoCategorize), ...contexts]
                    )
            },
            comment: makeIndex({
                fetchPending: limit => commentEmbeddingRepository.findPendingCommentContexts(limit),
                countPending: commentEmbeddingRepository.countPendingCommentContexts(),
                buildPrompt: context => buildCommentContext(context.comment),
                upsert: (context, embedding, dimensions) =>
                    commentEmbeddingRepository.upsert({ comment: context.comment, categoryId: context.categoryId, embedding, dimensions }),
                replaceTags: (embeddingId, tagIds) => commentEmbeddingRepository.replaceTags(embeddingId, tagIds)
            }),
            clearStaleFlags: transactionEmbeddingRepository.clearStaleFlags(),
            learnCorrection: Effect.fn('EmbeddingIndexService.learnCorrection')(
                function* (transactionId: number, previousCategoryIds: number[]) {
                    yield* merchantEmbeddingRepository.deleteStaleCategories(transactionId, previousCategoryIds);
                    yield* commentEmbeddingRepository.deleteStaleCategories(transactionId, previousCategoryIds);
                    yield* transactionEmbeddingRepository.markForEmbeddingByIds([transactionId]);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(EmbeddingIndexService, EmbeddingIndexService.make).pipe(
        Layer.provide([
            MerchantEmbeddingRepository.layer,
            CommentEmbeddingRepository.layer,
            TransactionEmbeddingRepository.layer,
            TransactionCategorizeInboxRepository.layer,
            EmbeddingService.layer,
            EmbeddingSuggestionService.layer
        ])
    );
}
