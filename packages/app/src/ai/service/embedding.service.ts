import { AiInvokeError } from '@budgie/ai';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL, EmbeddingInvoker } from '@budgie/categorization';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { isAiRuntimeActive } from '../utils/is-ai-runtime-active.util';

import { LlamaModelService } from './llama-model.service';

export class LocalEmbeddingService extends Context.Service<LocalEmbeddingService>()('@budgie/app/LocalEmbeddingService', {
    make: Effect.gen(function* () {
        const embeddingLock = yield* Semaphore.make(1);
        const llamaModel = new LlamaModelService({
            modelUrl: EMBEDDING_MODEL_URL,
            modelFilename: EMBEDDING_MODEL_FILENAME,
            contextSize: EMBEDDING_CONTEXT_SIZE,
            embedding: true,
            poolingType: 'mean',
            snapshot: embeddingModelSnapshotAtom
        });

        return {
            model: {
                snapshot: llamaModel.snapshot,
                start: () => llamaModel.start(),
                stop: () => embeddingLock.withPermit(llamaModel.stop())
            },
            embed: (text: string): Effect.Effect<number[], AiInvokeError> =>
                embeddingLock.withPermit(
                    Effect.suspend(() => {
                        const { context } = llamaModel;
                        if (!isAiRuntimeActive() || !llamaModel.isReady || !isDefined(context)) {
                            return Effect.succeed([]);
                        }

                        return Effect.tryPromise({
                            try: () => context.embedding(text),
                            catch: cause => new AiInvokeError({ cause })
                        }).pipe(
                            Effect.uninterruptible,
                            Effect.map(result => result.embedding)
                        );
                    })
                ),
            whenIdle: embeddingLock.withPermit(Effect.void)
        };
    })
}) {
    static readonly layer = Layer.effect(LocalEmbeddingService, LocalEmbeddingService.make);

    static readonly invokerLayer = Layer.effect(EmbeddingInvoker, LocalEmbeddingService).pipe(Layer.provide(LocalEmbeddingService.layer));
}
