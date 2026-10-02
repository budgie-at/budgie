import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_DOCUMENT_PREFIX } from '../constant/embedding.constant';
import { CommentEmbeddingRepository } from '../repository/comment-embedding.repository';
import { MerchantEmbeddingRepository } from '../repository/merchant-embedding.repository';
import { TransactionEmbeddingRepository } from '../repository/transaction-embedding.repository';
import { buildCommentContext } from '../util/build-comment-context.util';
import { buildMerchantContext } from '../util/build-merchant-context.util';
import { serializeEmbedding } from '../util/serialize-embedding.util';

import { EmbeddingInvoker } from './embedding-invoker.service';

import type { EmbeddingIndexSourceInterface } from '../interface/embedding-index-source.interface';
import type { EmbeddingPendingContextBaseInterface } from '../interface/embedding-pending-context-base.interface';

export class EmbeddingIndexService extends Context.Service<EmbeddingIndexService>()('@budgie/categorization/EmbeddingIndexService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const embeddingInvoker = yield* EmbeddingInvoker;

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

        return {
            merchant: makeIndex({
                fetchPending: limit => merchantEmbeddingRepository.findPendingMerchantContexts(limit),
                countPending: merchantEmbeddingRepository.countPendingMerchantContexts(),
                buildPrompt: context => buildMerchantContext(context.title, context.mccDescription, context.categoryTitleEn),
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
            }),
            comment: makeIndex({
                fetchPending: limit => commentEmbeddingRepository.findPendingCommentContexts(limit),
                countPending: commentEmbeddingRepository.countPendingCommentContexts(),
                buildPrompt: context => buildCommentContext(context.comment, context.categoryTitleEn),
                upsert: (context, embedding, dimensions) =>
                    commentEmbeddingRepository.upsert({ comment: context.comment, categoryId: context.categoryId, embedding, dimensions }),
                replaceTags: (embeddingId, tagIds) => commentEmbeddingRepository.replaceTags(embeddingId, tagIds)
            }),
            clearStaleFlags: transactionEmbeddingRepository.clearStaleFlags()
        };
    })
}) {
    static readonly layer = Layer.effect(EmbeddingIndexService, EmbeddingIndexService.make).pipe(
        Layer.provide([MerchantEmbeddingRepository.layer, CommentEmbeddingRepository.layer, TransactionEmbeddingRepository.layer])
    );
}
