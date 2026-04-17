import { EMBEDDING_BATCH_LIMIT, EmbeddingService, LlmInterface, serializeEmbedding } from '@budgie/ai';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { microPause } from '../../@generic/utils/micro-pause.util';
import { BatchConfigInterface } from '../interface/batch-config.interface';
import { ProgressCallbackInterface } from '../interface/progress-callback.interface';

import { isNativeCallSafe } from './is-native-call-safe.util';

interface ContextDataWithEmbedding {
    readonly context: string;
    readonly tagIds: number[];
}

interface StoreEmbeddingsConfigInterface<TContextData extends ContextDataWithEmbedding> {
    readonly items: TContextData[];
    readonly embeddings: Map<string, Float32Array>;
    readonly existingKeys: Set<string>;
    readonly callbacks: ProgressCallbackInterface;
    readonly batchConfig: Pick<BatchConfigInterface<unknown, TContextData>, 'getContextKey' | 'upsertEmbedding' | 'replaceTags'>;
}

const MAX_CONSECUTIVE_FAILURES = 3;

const storeEmbeddings = async <TContextData extends ContextDataWithEmbedding>(
    config: StoreEmbeddingsConfigInterface<TContextData>
): Promise<void> => {
    /* eslint-disable no-await-in-loop -- Sequential embedding storage */
    for (const item of config.items) {
        const embeddingVector = config.embeddings.get(item.context);

        if (isDefined(embeddingVector)) {
            const serialized = serializeEmbedding(embeddingVector);
            const embeddingId = await config.batchConfig.upsertEmbedding(item, serialized, embeddingVector.length);

            if (isDefined(embeddingId) && isNotEmptyArray(item.tagIds)) {
                await config.batchConfig.replaceTags(embeddingId, item.tagIds);
            }

            config.existingKeys.add(config.batchConfig.getContextKey(item));
            config.callbacks.onStep();
            config.callbacks.onEmbeddingStored(config.existingKeys.size);
            await microPause();
        }
    }
    /* eslint-enable no-await-in-loop */
};

// eslint-disable-next-line max-statements -- Batch processing with error recovery
export const processEmbeddingBatches = async <TRawData, TContextData extends ContextDataWithEmbedding>(
    llm: LlmInterface,
    existingKeys: Set<string>,
    callbacks: ProgressCallbackInterface,
    config: BatchConfigInterface<TRawData, TContextData>
): Promise<void> => {
    const embeddingService = new EmbeddingService(llm);
    let cursor: number | undefined;
    let hasMore = true;
    let consecutiveFailures = 0;

    /* eslint-disable no-await-in-loop -- Sequential batch processing */
    while (hasMore && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
        if (isDefined(callbacks.getMode) && !isNativeCallSafe(callbacks.getMode())) {
            return;
        }

        try {
            const rawData = await config.fetchBatch(EMBEDDING_BATCH_LIMIT, cursor);

            if (!isNotEmptyArray(rawData)) {
                break;
            }

            cursor = config.getCursor(rawData);

            const contextData = config.buildContextData(rawData);
            const unembedded = contextData.filter(item => !existingKeys.has(config.getContextKey(item)));

            if (isNotEmptyArray(unembedded)) {
                const embeddings = await embeddingService.generateEmbeddings(unembedded.map(item => item.context));

                if (embeddings.size === 0) {
                    consecutiveFailures += 1;
                } else {
                    await storeEmbeddings({ items: unembedded, embeddings, existingKeys, callbacks, batchConfig: config });
                }
            }

            if (consecutiveFailures === 0) {
                hasMore = rawData.length === EMBEDDING_BATCH_LIMIT;
            }
        } catch {
            consecutiveFailures += 1;
        }
    }
    /* eslint-enable no-await-in-loop */
};
