import { AiInvokeError } from '@budgie/ai';
import { EmbeddingInvoker } from '@budgie/categorization';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { embeddingModelSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '../util/ai-constants.util';

import { LlamaModelService } from './llama-model.service';

export class LocalEmbeddingService extends Context.Service<LocalEmbeddingService>()('@budgie/app/LocalEmbeddingService', {
    make: Effect.sync(() => {
        const model = new LlamaModelService({
            modelUrl: EMBEDDING_MODEL_URL,
            modelFilename: EMBEDDING_MODEL_FILENAME,
            contextSize: EMBEDDING_CONTEXT_SIZE,
            embedding: true,
            poolingType: 'mean',
            snapshot: embeddingModelSnapshotAtom
        });

        return {
            model,
            embed: (text: string): Effect.Effect<number[], AiInvokeError> => {
                const { context } = model;
                if (!model.isReady || !isDefined(context)) {
                    return Effect.succeed([]);
                }

                return Effect.tryPromise({
                    try: () => context.embedding(text),
                    catch: cause => new AiInvokeError({ cause })
                }).pipe(Effect.map(result => result.embedding));
            }
        };
    })
}) {
    static readonly layer = Layer.effect(LocalEmbeddingService, LocalEmbeddingService.make);

    static readonly invokerLayer = Layer.effect(EmbeddingInvoker, LocalEmbeddingService).pipe(Layer.provide(LocalEmbeddingService.layer));
}
