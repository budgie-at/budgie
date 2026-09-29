import * as Cache from 'effect/Cache';
import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { AiInvokeError } from '../../@generic/error/ai-invoke.error';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';

export class EmbeddingService {
    private static readonly inferenceSemaphore = Semaphore.makeUnsafe(1);
    private static readonly EMBEDDING_CACHE_LIMIT = 50;

    readonly generateEmbedding = Effect.fn('EmbeddingService.generateEmbedding')(function* (this: EmbeddingService, text: string) {
        return yield* Cache.get(this.embeddingCache, text).pipe(Effect.tapError(() => Cache.invalidate(this.embeddingCache, text)));
    });

    readonly generateEmbeddings = Effect.fn('EmbeddingService.generateEmbeddings')(function* (this: EmbeddingService, texts: string[]) {
        const rawResults = yield* EmbeddingService.inferenceSemaphore.withPermits(1)(
            Effect.tryPromise({
                try: () => this.embedding.batchEmbed(texts.slice(0, EMBEDDING_BATCH_LIMIT)),
                catch: cause => new AiInvokeError({ cause })
            })
        );

        return new Map([...rawResults].map(([text, embedding]) => [text, new Float32Array(embedding)]));
    });

    private readonly embeddingCache = Effect.runSync(
        Cache.make({
            capacity: EmbeddingService.EMBEDDING_CACHE_LIMIT,
            lookup: (text: string) => this.infer(text)
        })
    );

    constructor(private readonly embedding: EmbeddingInvokerInterface) {}

    isAvailable(): boolean {
        return this.embedding.isReady;
    }

    private infer(text: string): Effect.Effect<Float32Array | null, AiInvokeError> {
        return EmbeddingService.inferenceSemaphore.withPermits(1)(
            Effect.tryPromise({ try: () => this.embedding.embed(text), catch: cause => new AiInvokeError({ cause }) }).pipe(
                Effect.map(rawEmbedding => (isNotEmptyArray(rawEmbedding) ? new Float32Array(rawEmbedding) : null))
            )
        );
    }
}
