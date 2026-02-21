import { emptyFn, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { LlmInterface } from '../../@generic/interface/llm.interface';

export class EmbeddingService {
    private static inferenceQueue: Promise<void> = Promise.resolve();
    private static embeddingCache = new Map<string, Promise<Float32Array | null>>();
    private static EMBEDDING_CACHE_LIMIT = 50;

    constructor(private readonly llm: LlmInterface) {}

    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const cached = EmbeddingService.embeddingCache.get(text);
        if (isDefined(cached)) {
            return cached;
        }

        const promise = EmbeddingService.enqueueInference(() => this.executeEmbedding(text));
        EmbeddingService.embeddingCache.set(text, promise);
        EmbeddingService.evictOldestCacheEntry();

        void promise.then(emptyFn, () => EmbeddingService.embeddingCache.delete(text));

        return promise;
    }

    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        return EmbeddingService.enqueueInference(() => this.executeBatchEmbedding(texts));
    }

    isAvailable(): boolean {
        return this.llm.isEmbeddingReady;
    }

    private async executeEmbedding(text: string): Promise<Float32Array | null> {
        const rawEmbedding = await this.llm.embedding(text);

        if (!isNotEmptyArray(rawEmbedding)) {
            return null;
        }

        return new Float32Array(rawEmbedding);
    }

    private async executeBatchEmbedding(texts: string[]): Promise<Map<string, Float32Array>> {
        const batch = texts.slice(0, EMBEDDING_BATCH_LIMIT);
        const rawResults = await this.llm.batchEmbedding(batch);

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
