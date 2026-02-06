import { EMBEDDING_BATCH_LIMIT, EmbeddingService, LlmInterface, buildTransactionContext, serializeEmbedding } from '@budgie/ai';
import { UnembeddedTransactionDataInterface } from '@budgie/contracts';
import { useEffect, useRef } from 'react';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';

interface TransactionContextDataInterface {
    readonly title: string;
    readonly context: string;
}

const buildContextData = (transactionData: UnembeddedTransactionDataInterface[]): TransactionContextDataInterface[] =>
    transactionData
        .map(row => {
            const context = buildTransactionContext(row.title, row.mccFullDescription, row.comment);

            if (!isNotEmptyString(context)) {
                return null;
            }

            return { title: row.title, context };
        })
        .filter(isDefined);

const filterUnembeddedContexts = (
    contextData: TransactionContextDataInterface[],
    existingContexts: Set<string>
): TransactionContextDataInterface[] => contextData.filter(item => !existingContexts.has(item.context));

const storeEmbeddings = async (
    unembeddedContexts: TransactionContextDataInterface[],
    embeddings: Map<string, Float32Array>,
    existingContexts: Set<string>
): Promise<void> => {
    for (const item of unembeddedContexts) {
        const embeddingVector = embeddings.get(item.context);

        if (isDefined(embeddingVector)) {
            const serialized = serializeEmbedding(embeddingVector);
            await titleEmbeddingRepository.upsert(item.title, item.context, serialized, embeddingVector.length); // eslint-disable-line no-await-in-loop -- Sequential DB writes for upsert consistency
            existingContexts.add(item.context);
        }
    }
};

const processBatch = async (service: EmbeddingService, offset: number, existingContexts: Set<string>): Promise<boolean> => {
    const transactionData = await titleEmbeddingRepository.findTransactionData(EMBEDDING_BATCH_LIMIT, offset);

    if (!isNotEmptyArray(transactionData)) {
        return false;
    }

    const contextData = buildContextData(transactionData);
    const unembeddedContexts = filterUnembeddedContexts(contextData, existingContexts);

    if (isNotEmptyArray(unembeddedContexts)) {
        const contextStrings = unembeddedContexts.map(item => item.context);
        const embeddings = await service.generateEmbeddings(contextStrings);
        await storeEmbeddings(unembeddedContexts, embeddings, existingContexts);
    }

    return transactionData.length === EMBEDDING_BATCH_LIMIT;
};

const MAX_CONSECUTIVE_FAILURES = 3;

export const useEmbeddingSync = (llm: LlmInterface): void => {
    const isSyncingRef = useRef(false);

    useEffect(() => {
        if (!llm.isReady || isSyncingRef.current) {
            return;
        }

        const syncEmbeddings = async (): Promise<void> => {
            isSyncingRef.current = true;

            try {
                const service = new EmbeddingService(llm);
                const allContexts = await titleEmbeddingRepository.findAllContexts();
                const existingContexts = new Set(allContexts);
                let offset = 0;
                let hasMore = true;
                let consecutiveFailures = 0;

                while (hasMore && consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
                    try {
                        hasMore = await processBatch(service, offset, existingContexts); // eslint-disable-line no-await-in-loop -- Sequential batch processing to avoid overwhelming the device
                        consecutiveFailures = 0;
                    } catch {
                        consecutiveFailures += 1;
                    }
                    offset += EMBEDDING_BATCH_LIMIT;
                }
            } finally {
                isSyncingRef.current = false;
            }
        };

        void syncEmbeddings();
    }, [llm, llm.isReady]);
};
