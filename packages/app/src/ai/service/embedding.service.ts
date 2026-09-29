import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '../util/ai-constants.util';

import { LlamaModelService } from './llama-model.service';

import type { EmbeddingInvokerInterface } from '@budgie/ai';

class LocalEmbeddingService implements EmbeddingInvokerInterface {
    readonly model = new LlamaModelService({
        modelUrl: EMBEDDING_MODEL_URL,
        modelFilename: EMBEDDING_MODEL_FILENAME,
        contextSize: EMBEDDING_CONTEXT_SIZE,
        embedding: true,
        poolingType: 'mean'
    });

    get isReady(): boolean {
        return this.model.isReady;
    }

    async embed(text: string): Promise<number[]> {
        const { context } = this.model;
        if (!this.isReady || !isDefined(context)) {
            return [];
        }

        return (await context.embedding(text)).embedding;
    }

    batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>> {
        const { context } = this.model;
        if (!this.isReady || !isDefined(context)) {
            return Promise.resolve(new Map<string, number[]>());
        }

        return Effect.runPromise(
            Effect.forEach(texts, text =>
                Effect.option(
                    Effect.tryPromise(() => context.embedding(text)).pipe(Effect.map(result => [text, result.embedding] as const))
                )
            ).pipe(Effect.map(entries => new Map(entries.flatMap(Option.toArray).filter(([, embedding]) => isNotEmptyArray(embedding)))))
        );
    }
}

export const embeddingService = new LocalEmbeddingService();
