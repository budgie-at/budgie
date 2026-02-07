import { EmbeddingService, buildTransactionContext, serializeEmbedding } from '@budgie/ai';
import { useCallback } from 'react';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { mccCategoryRepository, titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../context/llm.context';

interface UseEmbeddingGeneratorReturn {
    readonly generateForTransaction: (title: string, comment: string, mccCategoryId: number | null) => void;
}

const generateAndStoreEmbedding = async (
    title: string,
    comment: string,
    mccCategoryId: number | null,
    llm: EmbeddingService
): Promise<void> => {
    const mccCategory = isDefined(mccCategoryId) ? await mccCategoryRepository.findById(mccCategoryId) : null;
    const mccDescription = mccCategory?.fullDescription ?? null;
    const context = buildTransactionContext(title, mccDescription, comment);

    if (!isNotEmptyString(context)) {
        return;
    }

    const embedding = await llm.generateEmbedding(context);

    if (!isDefined(embedding)) {
        return;
    }

    const serialized = serializeEmbedding(embedding);
    await titleEmbeddingRepository.upsert(title, context, serialized, embedding.length);
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

    return { generateForTransaction };
};
