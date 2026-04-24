import { Log, LoggerNamespaceEnum, getLogger } from '@budgie/contracts';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '../util/ai-constants.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { EmbeddingInvokerInterface } from '@budgie/ai';

const logger = getLogger(LoggerNamespaceEnum.EMBEDDING);

class LocalEmbeddingService
    extends BaseLlamaSubsystemService
    implements AiSubsystemServiceInterface<LlamaSubsystemSnapshotInterface>, EmbeddingInvokerInterface
{
    constructor() {
        super('embedding');
    }

    @Log(LoggerNamespaceEnum.EMBEDDING, 'embedding:embed:start')
    async embed(text: string): Promise<number[]> {
        if (!this.isReady || !isDefined(this.context)) {
            logger.log('embedding:embed:empty', { reason: 'not-ready' });

            return [];
        }
        const started = Date.now();
        try {
            const result = await this.context.embedding(text);
            logger.log('embedding:embed:complete', { durationMs: Date.now() - started, dimensions: result.embedding.length });

            return result.embedding;
        } catch (error: unknown) {
            logger.log('embedding:embed:empty', { reason: 'native-throw', errorMessage: getErrorMessage(error) });

            return [];
        }
    }

    @Log(LoggerNamespaceEnum.EMBEDDING, 'embedding:batchEmbed:start')
    async batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>> {
        // eslint-disable-next-line no-restricted-syntax -- readonly string[] isn't assignable to isEmptyArray's string[]
        if (!this.isReady || !isDefined(this.context) || texts.length === 0) {
            return new Map();
        }
        const started = Date.now();
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
        logger.log('embedding:batchEmbed:complete', { durationMs: Date.now() - started, resolved: results.size });

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
