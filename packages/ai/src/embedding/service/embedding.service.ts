import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_BATCH_LIMIT } from '../../@generic/constant/embedding.constant';
import { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';

export class EmbeddingService {
    private static inferenceQueue: Promise<void> = Promise.resolve();
    private static readonly embeddingCache = new Map<string, Promise<Float32Array | null>>();
    private static readonly EMBEDDING_CACHE_LIMIT = 50;

    constructor(private readonly embedding: EmbeddingInvokerInterface) {}

    @Log(
        text => `enter text="${text}"`,
        result => `done dimensions=${isDefined(result) ? result.length : 0}`,
        (error, text) => `throw text="${text}" error=${getErrorMessage(error)}`
    )
    async generateEmbedding(text: string): Promise<Float32Array | null> {
        const cached = EmbeddingService.embeddingCache.get(text);
        if (isDefined(cached)) {
            return cached;
        }

        return this.enqueueEmbedding(text);
    }

    @Log(
        texts => `enter count=${texts.length}`,
        result => `done resolved=${result.size}`,
        (error, texts) => `throw count=${texts.length} error=${getErrorMessage(error)}`
    )
    async generateEmbeddings(texts: string[]): Promise<Map<string, Float32Array>> {
        return EmbeddingService.enqueueInference(() => this.executeBatchEmbedding(texts));
    }

    @Log('enter', result => `done available=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    isAvailable(): boolean {
        return this.embedding.isReady;
    }

    private async enqueueEmbedding(text: string): Promise<Float32Array | null> {
        const promise = EmbeddingService.enqueueInference(() => this.executeEmbedding(text));
        EmbeddingService.embeddingCache.set(text, promise);
        EmbeddingService.evictOldestCacheEntry();

        void promise.catch(() => EmbeddingService.embeddingCache.delete(text));

        return promise;
    }

    private async executeEmbedding(text: string): Promise<Float32Array | null> {
        const rawEmbedding = await this.embedding.embed(text);

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
