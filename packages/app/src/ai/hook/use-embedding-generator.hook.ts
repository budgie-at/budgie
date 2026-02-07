import { EmbeddingService, buildTransactionContext, serializeEmbedding } from '@budgie/ai';
import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useCallback } from 'react';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { mccCategoryRepository, titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../context/llm.context';

interface UseEmbeddingGeneratorReturn {
    readonly generateForTransaction: (title: string, comment: string, mccCategoryId: number | null) => void;
    readonly generateForTransactions: (transactions: readonly TransactionCreateInputInterface[]) => void;
}

const generateAndStoreEmbedding = async (
    title: string,
    comment: string,
    mccCategoryId: number | null,
    embeddingService: EmbeddingService
): Promise<void> => {
    const mccCategory = isDefined(mccCategoryId) ? await mccCategoryRepository.findById(mccCategoryId) : null;
    const mccDescription = mccCategory?.fullDescription ?? null;
    const context = buildTransactionContext(title, mccDescription, comment);

    if (!isNotEmptyString(context)) {
        return;
    }

    const embedding = await embeddingService.generateEmbedding(context);

    if (!isDefined(embedding)) {
        return;
    }

    const serialized = serializeEmbedding(embedding);
    await titleEmbeddingRepository.upsert(title, context, serialized, embedding.length);
};

const generateAndStoreEmbeddings = async (
    transactions: readonly TransactionCreateInputInterface[],
    embeddingService: EmbeddingService
): Promise<void> => {
    const processed = new Set<string>();

    for (const transaction of transactions) {
        const key = `${transaction.title}|${transaction.comment}`;
        if (processed.has(key)) {
            continue; // eslint-disable-line no-continue -- Dedup by title+comment
        }

        processed.add(key);
        const mccCategoryId = transaction.entries[0]?.mccCategoryId ?? null;
        await generateAndStoreEmbedding(transaction.title, transaction.comment, mccCategoryId, embeddingService); // eslint-disable-line no-await-in-loop -- Sequential to avoid overwhelming LLM
    }
};

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturn => {
    const { llm } = useLlmContext();

    const generateForTransaction = useCallback(
        (title: string, comment: string, mccCategoryId: number | null): void => {
            if (!llm.isReady) {
                return;
            }

            const embeddingService = new EmbeddingService(llm);
            generateAndStoreEmbedding(title, comment, mccCategoryId, embeddingService).catch(emptyFn);
        },
        [llm]
    );

    const generateForTransactions = useCallback(
        (transactions: readonly TransactionCreateInputInterface[]): void => {
            if (!llm.isReady) {
                return;
            }

            const embeddingService = new EmbeddingService(llm);
            generateAndStoreEmbeddings(transactions, embeddingService).catch(emptyFn);
        },
        [llm]
    );

    return { generateForTransaction, generateForTransactions };
};
