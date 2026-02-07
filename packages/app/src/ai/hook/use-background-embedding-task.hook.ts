import { EMBEDDING_BATCH_LIMIT, EmbeddingService, LlmInterface, buildTransactionContext, serializeEmbedding } from '@budgie/ai';
import { useEffect, useRef } from 'react';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';

const BACKGROUND_EMBEDDING_INTERVAL_MS = 60_000;

// eslint-disable-next-line max-statements -- Batch processing with cursor pagination
const processAllUnembedded = async (embeddingService: EmbeddingService): Promise<void> => {
    const existingContexts = new Set(await titleEmbeddingRepository.findAllContexts());
    let cursor: number | undefined;
    let hasMore = true;

    /* eslint-disable no-await-in-loop -- Sequential batch processing to avoid overwhelming LLM */
    while (hasMore) {
        const transactionData = await titleEmbeddingRepository.findTransactionData(EMBEDDING_BATCH_LIMIT, cursor);

        if (!isNotEmptyArray(transactionData)) {
            break;
        }

        for (const row of transactionData) {
            const context = buildTransactionContext(row.title, row.mccFullDescription, row.comment);

            if (!isNotEmptyString(context) || existingContexts.has(context)) {
                continue; // eslint-disable-line no-continue -- Skip already embedded or empty contexts
            }

            const embedding = await embeddingService.generateEmbedding(context);

            if (isDefined(embedding)) {
                const serialized = serializeEmbedding(embedding);
                await titleEmbeddingRepository.upsert(row.title, context, serialized, embedding.length);
                existingContexts.add(context);
            }
        }

        hasMore = transactionData.length === EMBEDDING_BATCH_LIMIT;
        cursor = transactionData[transactionData.length - 1].maxOperatedAt;
    }
    /* eslint-enable no-await-in-loop */
};

export const useBackgroundEmbeddingTask = (llm: LlmInterface): void => {
    const isRunningRef = useRef(false);

    useEffect(() => {
        const run = async (): Promise<void> => {
            if (!llm.isReady || isRunningRef.current) {
                return;
            }

            isRunningRef.current = true;

            try {
                await processAllUnembedded(new EmbeddingService(llm));
            } finally {
                isRunningRef.current = false; // eslint-disable-line require-atomic-updates -- Intentional: ref is only written by this function
            }
        };

        void run().catch(emptyFn);

        const interval = setInterval(() => void run().catch(emptyFn), BACKGROUND_EMBEDDING_INTERVAL_MS);

        return () => void clearInterval(interval);
    }, [llm]);
};
