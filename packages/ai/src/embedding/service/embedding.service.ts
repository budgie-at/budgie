import * as Cache from 'effect/Cache';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiInvokeError } from '../../@generic/error/ai-invoke.error';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';

export class EmbeddingService {
    private static readonly inferenceSemaphore = Semaphore.makeUnsafe(1);
    private static readonly EMBEDDING_CACHE_LIMIT = 50;

    readonly generateEmbedding = Effect.fn('EmbeddingService.generateEmbedding')(function* (this: EmbeddingService, text: string) {
        return yield* Cache.get(this.embeddingCache, text);
    });

    private readonly embeddingCache = Effect.runSync(
        Cache.makeWith((text: string) => this.infer(text), {
            capacity: EmbeddingService.EMBEDDING_CACHE_LIMIT,
            timeToLive: exit => (Exit.isSuccess(exit) && isDefined(exit.value) ? Duration.infinity : Duration.zero)
        })
    );

    constructor(private readonly embedding: EmbeddingInvokerInterface) {}

    private infer(text: string): Effect.Effect<Float32Array | null, AiInvokeError> {
        return EmbeddingService.inferenceSemaphore
            .withPermits(1)(this.embedding.embed(text))
            .pipe(Effect.map(rawEmbedding => (isNotEmptyArray(rawEmbedding) ? new Float32Array(rawEmbedding) : null)));
    }
}
