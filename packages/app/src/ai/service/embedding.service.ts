import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AiSubsystemServiceInterface } from '../interface/ai-subsystem-service.interface';
import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { EMBEDDING_CONTEXT_SIZE, EMBEDDING_MODEL_FILENAME, EMBEDDING_MODEL_URL } from '../util/ai-constants.util';
import { aiLog } from '../utils/ai-log.util';

import { BaseLlamaSubsystemService } from './base-subsystem.service';

import type { EmbeddingInvokerInterface } from '@budgie/ai';

class LocalEmbeddingService
    extends BaseLlamaSubsystemService
    implements AiSubsystemServiceInterface<LlamaSubsystemSnapshotInterface>, EmbeddingInvokerInterface
{
    constructor() {
        super('embedding');
    }

    async embed(text: string): Promise<number[]> {
        aiLog('embedding:embed:start', { textLen: text.length, text: text.slice(0, 80) });
        if (!this.isReady || !isDefined(this.context)) {
            aiLog('embedding:embed:empty', { reason: 'not-ready' });

            return [];
        }
        const started = Date.now();
        try {
            const result = await this.context.embedding(text);
            aiLog('embedding:embed:complete', { durationMs: Date.now() - started, dimensions: result.embedding.length });

            return result.embedding;
        } catch (error: unknown) {
            aiLog('embedding:embed:empty', { reason: 'native-throw', errorMessage: getErrorMessage(error) });

            return [];
        }
    }

    // eslint-disable-next-line max-statements -- Sequential batch embedding with start/complete log markers
    async batchEmbed(texts: readonly string[]): Promise<Map<string, number[]>> {
        aiLog('embedding:batchEmbed:start', { textsCount: texts.length });
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
        aiLog('embedding:batchEmbed:complete', { durationMs: Date.now() - started, resolved: results.size });

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
