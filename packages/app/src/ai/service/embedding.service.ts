import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '../util/ai-constants.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { EmbeddingInvokerInterface } from '@budgie/ai';

class LocalEmbeddingService
    extends BaseLlamaSubsystemService
    implements AiSubsystemServiceInterface<LlamaSubsystemSnapshotInterface>, EmbeddingInvokerInterface
{
    constructor() {
        super('embedding');
    }

    @Log(
        text => `enter text="${text}"`,
        result => `done dimensions=${result.length}`,
        (error, text) => `throw text="${text}" error=${getErrorMessage(error)}`
    )
    async embed(text: string): Promise<number[]> {
        if (!this.isReady || !isDefined(this.context)) {
            return [];
        }
        const result = await this.context.embedding(text);

        return result.embedding;
    }

    @Log(
        texts => `enter texts=${texts.join(',')}`,
        result => `done resolvedKeys=${[...result.keys()].join(',')}`,
        (error, texts) => `throw texts=${texts.join(',')} error=${getErrorMessage(error)}`
    )
    async batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>> {
        // eslint-disable-next-line no-restricted-syntax -- readonly string[] isn't assignable to isEmptyArray's string[]
        if (!this.isReady || !isDefined(this.context) || texts.length === 0) {
            return new Map();
        }
        const results = new Map<string, number[]>();
        /* eslint-disable no-await-in-loop -- Sequential batch embedding to avoid Metal thrash */
        for (const text of texts) {
            try {
                const result = await this.context.embedding(text);
                if (isNotEmptyArray(result.embedding)) {
                    results.set(text, result.embedding);
                }
            } catch {
                emptyFn();
            }
        }
        /* eslint-enable no-await-in-loop */

        return results;
    }

    protected getLlamaConfig() {
        return {
            modelUrl: EMBEDDING_MODEL_URL,
            modelFilename: EMBEDDING_MODEL_FILENAME,
            contextSize: EMBEDDING_CONTEXT_SIZE,
            embedding: true,
            poolingType: 'mean' as const
        };
    }
}

export const embeddingService = new LocalEmbeddingService();
