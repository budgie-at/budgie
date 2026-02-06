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
    embeddings: Map<string, Float32Array>
): Promise<void> => {
    for (const item of unembeddedContexts) {
        const embeddingVector = embeddings.get(item.context);

        if (isDefined(embeddingVector)) {
            const serialized = serializeEmbedding(embeddingVector);
            await titleEmbeddingRepository.upsert(item.title, item.context, serialized, embeddingVector.length); // eslint-disable-line no-await-in-loop -- Sequential DB writes for upsert consistency
        }
    }
};

export const useEmbeddingSync = (llm: LlmInterface): void => {
    const isSyncingRef = useRef(false);

    useEffect(() => {
        if (!llm.isReady || isSyncingRef.current) {
            return;
        }

        const syncEmbeddings = async (): Promise<void> => {
            isSyncingRef.current = true;

            try {
                const [transactionData, allContexts] = await Promise.all([
                    titleEmbeddingRepository.findTransactionData(EMBEDDING_BATCH_LIMIT),
                    titleEmbeddingRepository.findAllContexts()
                ]);

                const contextData = buildContextData(transactionData);
                const unembeddedContexts = filterUnembeddedContexts(contextData, new Set(allContexts));

                if (!isNotEmptyArray(unembeddedContexts)) {
                    return;
                }

                const service = new EmbeddingService(llm);
                const contextStrings = unembeddedContexts.map(item => item.context);
                const embeddings = await service.generateEmbeddings(contextStrings);

                await storeEmbeddings(unembeddedContexts, embeddings);
            } finally {
                isSyncingRef.current = false;
            }
        };

        void syncEmbeddings();
    }, [llm, llm.isReady]);
};
