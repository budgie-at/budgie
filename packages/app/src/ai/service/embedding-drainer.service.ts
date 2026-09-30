import { AiInvokeError, buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { commentEmbeddingRepository, merchantEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { EmbeddingDrainerSourceInterface } from '../interface/embedding-drainer-source.interface';
import { embeddingProgressStore } from '../store/embedding-progress.store';

import { DrainerService } from './drainer.service';
import { embeddingService } from './embedding.service';

import type { DbError, EmbeddingPendingContextBaseInterface } from '@budgie/contracts';

class EmbeddingDrainerService {
    private static readonly RELAXED_INTERVAL_MS = 2500;
    private static readonly RELAXED_BATCH_SIZE = 5;
    private static readonly BOOST_BATCH_SIZE = 15;
    private static readonly YIELD_EVERY_ROWS = 3;

    readonly merchant = this.createDrainer({
        fetchPending: limit => merchantEmbeddingRepository.findPendingMerchantContexts(limit),
        countPending: merchantEmbeddingRepository.countPendingMerchantContexts(),
        buildPrompt: context =>
            buildMerchantContext({ title: context.title, mccDescription: context.mccDescription, categoryTitle: context.categoryTitleEn }),
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

    readonly comment = this.createDrainer({
        fetchPending: limit => commentEmbeddingRepository.findPendingCommentContexts(limit),
        countPending: commentEmbeddingRepository.countPendingCommentContexts(),
        buildPrompt: context => buildCommentContext({ comment: context.comment, categoryTitle: context.categoryTitleEn }),
        upsert: (context, embedding, dimensions) =>
            commentEmbeddingRepository.upsert({ comment: context.comment, categoryId: context.categoryId, embedding, dimensions }),
        replaceTags: (embeddingId, tagIds) => commentEmbeddingRepository.replaceTags(embeddingId, tagIds)
    });

    readonly drainers = [this.merchant, this.comment];

    readonly snapshot = Atom.make((get): DrainerSnapshotInterface => {
        const merchant = get(this.merchant.snapshot);
        const comment = get(this.comment.snapshot);

        return {
            state: EmbeddingDrainerService.deriveState(merchant.state, comment.state),
            pending: merchant.pending + comment.pending,
            errorMessage: merchant.errorMessage ?? comment.errorMessage
        };
    });

    readonly start = Effect.fn('EmbeddingDrainerService.start')(function* (this: EmbeddingDrainerService) {
        yield* this.merchant.start();
        yield* this.comment.start();
        if (this.residueCleared) {
            return;
        }
        this.residueCleared = true;
        yield* Effect.forkDetach(
            Effect.ignore(
                Db.transaction(
                    Effect.all([
                        transactionRepository.clearNonIndexableFlags(),
                        transactionRepository.clearAlreadyIndexedMerchantFlags(),
                        transactionRepository.clearAlreadyIndexedCommentFlags()
                    ])
                )
            )
        );
    });

    readonly boost = Effect.fn('EmbeddingDrainerService.boost')(function* (this: EmbeddingDrainerService) {
        yield* this.merchant.boost();
        if (aiAtomRegistry.get(this.comment.snapshot).state !== DrainerStateEnum.PAUSED) {
            yield* this.comment.boost();
        }
    });

    readonly pause = Effect.fn('EmbeddingDrainerService.pause')(function* (this: EmbeddingDrainerService) {
        yield* Effect.forEach(this.drainers, drainer => drainer.pause(), { concurrency: 'unbounded', discard: true });
    });

    readonly resume = Effect.fn('EmbeddingDrainerService.resume')(function* (this: EmbeddingDrainerService) {
        yield* Effect.forEach(this.drainers, drainer => drainer.resume(), { discard: true });
    });

    private residueCleared = false;

    private createDrainer<TContext extends EmbeddingPendingContextBaseInterface>(
        source: EmbeddingDrainerSourceInterface<TContext>
    ): DrainerService<DbError | AiInvokeError> {
        const pendingPersists: (readonly [number, TContext])[] = [];
        const embed = (context: TContext): Effect.Effect<void, DbError | AiInvokeError, Db> =>
            Effect.gen(function* () {
                const embeddingId = isDefined(context.existingEmbeddingId)
                    ? context.existingEmbeddingId
                    : yield* Effect.tryPromise({
                          try: () => embeddingService.embed(source.buildPrompt(context)),
                          catch: cause => new AiInvokeError({ cause })
                      }).pipe(
                          Effect.flatMap(rawEmbedding =>
                              isNotEmptyArray(rawEmbedding)
                                  ? source.upsert(context, serializeEmbedding(new Float32Array(rawEmbedding)), rawEmbedding.length)
                                  : Effect.succeed(null)
                          )
                      );
                if (isDefined(embeddingId)) {
                    pendingPersists.push([embeddingId, context]);
                }
            });

        return new DrainerService({
            subsystem: AiSubsystemNameEnum.EMBEDDING,
            relaxedIntervalMs: EmbeddingDrainerService.RELAXED_INTERVAL_MS,
            relaxedBatchSize: EmbeddingDrainerService.RELAXED_BATCH_SIZE,
            boostBatchSize: EmbeddingDrainerService.BOOST_BATCH_SIZE,
            yieldEveryRows: EmbeddingDrainerService.YIELD_EVERY_ROWS,
            fetchPending: limit => Effect.map(source.fetchPending(limit), contexts => contexts.map(embed)),
            countPending: source.countPending,
            afterBatch: Effect.suspend(() => {
                const batch = pendingPersists.splice(0);

                return isEmptyArray(batch)
                    ? Effect.void
                    : Db.transaction(
                          Effect.forEach(batch, ([embeddingId, context]) => source.replaceTags(embeddingId, context.tagIds), {
                              discard: true
                          }).pipe(
                              Effect.andThen(
                                  transactionRepository.clearNeedsEmbedding(batch.flatMap(([, context]) => context.transactionIds))
                              )
                          )
                      ).pipe(Effect.andThen(embeddingProgressStore.refresh()));
            })
        });
    }

    private static deriveState(merchantState: DrainerStateEnum, commentState: DrainerStateEnum): DrainerStateEnum {
        if (merchantState === DrainerStateEnum.ERROR || commentState === DrainerStateEnum.ERROR) {
            return DrainerStateEnum.ERROR;
        }
        if (merchantState === DrainerStateEnum.BOOSTING || commentState === DrainerStateEnum.BOOSTING) {
            return DrainerStateEnum.BOOSTING;
        }
        if (merchantState === DrainerStateEnum.PAUSED && commentState === DrainerStateEnum.PAUSED) {
            return DrainerStateEnum.PAUSED;
        }

        return DrainerStateEnum.IDLE;
    }
}

export const embeddingDrainerService = new EmbeddingDrainerService();
