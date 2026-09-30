import { AiInvokeError, buildCommentContext, buildMerchantContext, serializeEmbedding } from '@budgie/ai';
import { CommentEmbeddingRepository, Db, MerchantEmbeddingRepository, TransactionEmbeddingRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { aiAtomRegistry } from '../constant/ai-atom-registry.constant';
import { commentEmbeddingDrainerSnapshotAtom, merchantEmbeddingDrainerSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import { EmbeddingDrainerSourceInterface } from '../interface/embedding-drainer-source.interface';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';

import { AiModelResidencyService } from './ai-model-residency.service';
import { DrainerService } from './drainer.service';
import { LocalEmbeddingService } from './embedding.service';

import type { DbError, EmbeddingPendingContextBaseInterface } from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

export class EmbeddingDrainerService extends Context.Service<EmbeddingDrainerService>()('@budgie/app/EmbeddingDrainerService', {
    make: Effect.gen(function* () {
        const merchantEmbeddingRepository = yield* MerchantEmbeddingRepository;
        const commentEmbeddingRepository = yield* CommentEmbeddingRepository;
        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
        const localEmbeddingService = yield* LocalEmbeddingService;
        const embeddingProgressStore = yield* EmbeddingProgressStore;
        const aiModelResidencyService = yield* AiModelResidencyService;
        let residueCleared = false;

        const createDrainer = <TContext extends EmbeddingPendingContextBaseInterface>(
            source: EmbeddingDrainerSourceInterface<TContext>,
            snapshot: Atom.Writable<DrainerSnapshotInterface>
        ): DrainerService<DbError | AiInvokeError> => {
            const pendingPersists: (readonly [number, TContext])[] = [];
            const embed = (context: TContext): Effect.Effect<void, DbError | AiInvokeError, Db> =>
                Effect.gen(function* () {
                    const embeddingId = isDefined(context.existingEmbeddingId)
                        ? context.existingEmbeddingId
                        : yield* localEmbeddingService
                              .embed(source.buildPrompt(context))
                              .pipe(
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

            return new DrainerService(
                {
                    subsystem: AiSubsystemNameEnum.EMBEDDING,
                    relaxedIntervalMs: 2500,
                    relaxedBatchSize: 5,
                    boostBatchSize: 15,
                    yieldEveryRows: 3,
                    snapshot,
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
                                          transactionEmbeddingRepository.clearNeedsEmbedding(
                                              batch.flatMap(([, context]) => context.transactionIds)
                                          )
                                      )
                                  )
                              ).pipe(Effect.andThen(embeddingProgressStore.refresh()));
                    })
                },
                aiModelResidencyService
            );
        };

        const merchant = createDrainer(
            {
                fetchPending: limit => merchantEmbeddingRepository.findPendingMerchantContexts(limit),
                countPending: merchantEmbeddingRepository.countPendingMerchantContexts(),
                buildPrompt: context =>
                    buildMerchantContext({
                        title: context.title,
                        mccDescription: context.mccDescription,
                        categoryTitle: context.categoryTitleEn
                    }),
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
            },
            merchantEmbeddingDrainerSnapshotAtom
        );

        const comment = createDrainer(
            {
                fetchPending: limit => commentEmbeddingRepository.findPendingCommentContexts(limit),
                countPending: commentEmbeddingRepository.countPendingCommentContexts(),
                buildPrompt: context => buildCommentContext({ comment: context.comment, categoryTitle: context.categoryTitleEn }),
                upsert: (context, embedding, dimensions) =>
                    commentEmbeddingRepository.upsert({ comment: context.comment, categoryId: context.categoryId, embedding, dimensions }),
                replaceTags: (embeddingId, tagIds) => commentEmbeddingRepository.replaceTags(embeddingId, tagIds)
            },
            commentEmbeddingDrainerSnapshotAtom
        );

        const drainers = [merchant, comment];

        return {
            drainers,
            start: Effect.fn('EmbeddingDrainerService.start')(function* () {
                yield* merchant.start();
                yield* comment.start();
                if (residueCleared) {
                    return;
                }
                residueCleared = true;
                yield* Effect.forkDetach(
                    Effect.ignore(
                        Db.transaction(
                            Effect.all([
                                transactionEmbeddingRepository.clearNonIndexableFlags(),
                                transactionEmbeddingRepository.clearAlreadyIndexedMerchantFlags(),
                                transactionEmbeddingRepository.clearAlreadyIndexedCommentFlags()
                            ])
                        )
                    )
                );
            }),
            boost: Effect.fn('EmbeddingDrainerService.boost')(function* () {
                yield* merchant.boost();
                if (aiAtomRegistry.get(comment.snapshot).state !== DrainerStateEnum.PAUSED) {
                    yield* comment.boost();
                }
            }),
            pause: Effect.fn('EmbeddingDrainerService.pause')(function* () {
                yield* Effect.forEach(drainers, drainer => drainer.pause(), { concurrency: 'unbounded', discard: true });
            }),
            resume: Effect.fn('EmbeddingDrainerService.resume')(function* () {
                yield* Effect.forEach(drainers, drainer => drainer.resume(), { discard: true });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EmbeddingDrainerService, EmbeddingDrainerService.make).pipe(
        Layer.provide([
            MerchantEmbeddingRepository.layer,
            CommentEmbeddingRepository.layer,
            TransactionEmbeddingRepository.layer,
            LocalEmbeddingService.layer,
            EmbeddingProgressStore.layer,
            AiModelResidencyService.layer
        ])
    );
}
