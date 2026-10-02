import { AiInvokeError, EmbeddingInvoker } from '@budgie/ai';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

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
            get isReady(): boolean {
                return model.isReady;
            },
            embed: (text: string): Effect.Effect<number[], AiInvokeError> => {
                const { context } = model;
                if (!model.isReady || !isDefined(context)) {
                    return Effect.succeed([]);
                }

                return Effect.tryPromise({
                    try: () => context.embedding(text),
                    catch: cause => new AiInvokeError({ cause })
                }).pipe(Effect.map(result => result.embedding));
            },
            batchEmbed: (texts: readonly string[]): Effect.Effect<Map<string, number[]>, AiInvokeError> => {
                const { context } = model;
                if (!model.isReady || !isDefined(context)) {
                    return Effect.succeed(new Map<string, number[]>());
                }

                return Effect.forEach(texts, text =>
                    Effect.option(
                        Effect.tryPromise(() => context.embedding(text)).pipe(Effect.map(result => [text, result.embedding] as const))
                    )
                ).pipe(
                    Effect.map(entries => new Map(entries.flatMap(Option.toArray).filter(([, embedding]) => isNotEmptyArray(embedding))))
                );
            }
        };
    })
}) {
    static readonly layer = Layer.effect(LocalEmbeddingService, LocalEmbeddingService.make);

    static readonly invokerLayer = Layer.effect(EmbeddingInvoker, LocalEmbeddingService).pipe(Layer.provide(LocalEmbeddingService.layer));
}
