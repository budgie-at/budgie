import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EmbeddingInvoker } from './embedding-invoker.service';

export class EmbeddingService extends Context.Service<EmbeddingService>()('@budgie/ai/EmbeddingService', {
    make: Effect.gen(function* () {
        const embeddingInvoker = yield* EmbeddingInvoker;
        const inferenceSemaphore = yield* Semaphore.make(1);
        const embeddingCache = yield* Cache.makeWith(
            (text: string) =>
                inferenceSemaphore
                    .withPermits(1)(embeddingInvoker.embed(text))
                    .pipe(Effect.map(rawEmbedding => (isNotEmptyArray(rawEmbedding) ? new Float32Array(rawEmbedding) : null))),
            {
                capacity: 50,
                timeToLive: exit => (Exit.isSuccess(exit) && isDefined(exit.value) ? Duration.infinity : Duration.zero)
            }
        );

        return {
            generateEmbedding: Effect.fn('EmbeddingService.generateEmbedding')(function* (text: string) {
                return yield* Cache.get(embeddingCache, text);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EmbeddingService, EmbeddingService.make);
}
