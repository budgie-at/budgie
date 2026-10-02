import { EmbeddingIndexService } from '@budgie/categorization';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { commentEmbeddingDrainerSnapshotAtom, merchantEmbeddingDrainerSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { DrainerStateEnum } from '../enum/drainer-state.enum';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';

import { AiModelResidencyService } from './ai-model-residency.service';
import { DrainerService } from './drainer.service';
import { LocalEmbeddingService } from './embedding.service';

import type { DrainerSnapshotInterface } from '../interface/drainer-snapshot.interface';
import type { AiInvokeError } from '@budgie/ai';
import type { DbError } from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

export class EmbeddingDrainerService extends Context.Service<EmbeddingDrainerService>()('@budgie/app/EmbeddingDrainerService', {
    make: Effect.gen(function* () {
        const embeddingIndexService = yield* EmbeddingIndexService;
        const embeddingProgressStore = yield* EmbeddingProgressStore;
        const aiModelResidencyService = yield* AiModelResidencyService;
        let residueCleared = false;

        const createDrainer = (
            index: typeof embeddingIndexService.merchant,
            snapshot: Atom.Writable<DrainerSnapshotInterface>
        ): DrainerService<DbError | AiInvokeError> =>
            new DrainerService(
                {
                    subsystem: AiSubsystemNameEnum.EMBEDDING,
                    relaxedIntervalMs: 2500,
                    relaxedBatchSize: 5,
                    boostBatchSize: 15,
                    yieldEveryRows: 3,
                    snapshot,
                    fetchPending: index.next,
                    countPending: index.countPending,
                    afterBatch: index.flush.pipe(Effect.andThen(embeddingProgressStore.refresh()))
                },
                aiModelResidencyService
            );

        const merchant = createDrainer(embeddingIndexService.merchant, merchantEmbeddingDrainerSnapshotAtom);
        const comment = createDrainer(embeddingIndexService.comment, commentEmbeddingDrainerSnapshotAtom);
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
                yield* Effect.forkDetach(Effect.ignore(embeddingIndexService.clearStaleFlags));
            }),
            boost: Effect.fn('EmbeddingDrainerService.boost')(function* () {
                yield* merchant.boost();
                if (appAtomRegistry.get(comment.snapshot).state !== DrainerStateEnum.PAUSED) {
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
            EmbeddingIndexService.layer.pipe(Layer.provide(LocalEmbeddingService.invokerLayer)),
            EmbeddingProgressStore.layer,
            AiModelResidencyService.layer
        ])
    );
}
