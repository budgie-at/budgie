import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { aiLog } from '../../@generic/util/ai-log.util';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';

export class EmbeddingService {
    private static inferenceQueue: Promise<void> = Promise.resolve();
    private static embeddingCache = new Map<string, Promise<Float32Array | null>>();
    private static EMBEDDING_CACHE_LIMIT = 50;

    constructor(private readonly embedding: EmbeddingInvokerInterface) {}

    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const cached = EmbeddingService.embeddingCache.get(text);
        if (isDefined(cached)) {
            aiLog('embedding:generateEmbedding:cache-hit', { textLen: text.length });

            return cached;
        }

        aiLog('embedding:generateEmbedding:enqueue', { textLen: text.length });
        const enqueueStart = Date.now();
        const promise = EmbeddingService.enqueueInference(() => this.executeEmbedding(text));
        EmbeddingService.embeddingCache.set(text, promise);
        EmbeddingService.evictOldestCacheEntry();

        void promise.then(
            result => {
                aiLog('embedding:generateEmbedding:done', {
                    textLen: text.length,
                    dimensions: result === null ? 0 : result.length,
                    durationMs: Date.now() - enqueueStart
                });

                return result;
            },
            () => EmbeddingService.embeddingCache.delete(text)
        );

        return promise;
    }

    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        return EmbeddingService.enqueueInference(() => this.executeBatchEmbedding(texts));
    }

    isAvailable(): boolean {
        return this.embedding.isReady;
    }

    private async executeEmbedding(text: string): Promise<Float32Array | null> {
        const start = Date.now();
        aiLog('embedding:llmEmbed:start', { textLen: text.length });
        const rawEmbedding = await this.embedding.embed(text);
        aiLog('embedding:llmEmbed:done', { textLen: text.length, rawLen: rawEmbedding.length, durationMs: Date.now() - start });

        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return new Float32Array(rawEmbedding);
    }

    private async executeBatchEmbedding(texts: string[]): Promise<Map<string, Float32Array>> {
        const batch = texts.slice(0, EMBEDDING_BATCH_LIMIT);
        const rawResults = await this.embedding.batchEmbed(batch);

        const results = new Map<string, Float32Array>();
        for (const [text, embedding] of rawResults) {
            results.set(text, new Float32Array(embedding));
        }

        return results;
    }

    private static evictOldestCacheEntry(): void {
        if (EmbeddingService.embeddingCache.size <= EmbeddingService.EMBEDDING_CACHE_LIMIT) {
            return;
        }

        const firstKey = EmbeddingService.embeddingCache.keys().next().value;
        if (isDefined(firstKey)) {
            EmbeddingService.embeddingCache.delete(firstKey);
        }
    }

    private static enqueueInference<T>(fn: () => Promise<T>): Promise<T> {
        const current = EmbeddingService.inferenceQueue.then(fn);
        EmbeddingService.inferenceQueue = current.then(emptyFn, emptyFn);

        return current;
    }
}
