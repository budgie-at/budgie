import { getLogger } from '@budgie/logger';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { embeddingProgressStore } from '../store/embedding-progress.store';

const logger = getLogger('useEmbeddingGenerator');

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (transactionId: number) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
}

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const markForEmbedding = (transactionId: number): void => {
        logger.log('embed:defer:mark', { transactionId });
        transactionRepository
            .markForEmbeddingByIds([transactionId])
            .then(() => embeddingProgressStore.refresh())
            .catch(emptyFn);
    };

    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        logger.log('embed:defer:markMany', { count: ids.length, transactionIds: ids });

        transactionRepository
            .markForEmbeddingByIds(ids)
            .then(() => embeddingProgressStore.refresh())
            .catch(emptyFn);
    };

    return { markForEmbedding, markManyForEmbedding };
};
