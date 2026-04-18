import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { embeddingProgressStore } from '../store/embedding-progress.store';
import { aiLog } from '../utils/ai-log.util';

interface MarkParamsInterface {
    readonly transactionId: number;
}

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (params: MarkParamsInterface) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
}

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const markForEmbedding = (params: MarkParamsInterface): void => {
        aiLog('embed:defer:mark', { transactionId: params.transactionId });
        transactionRepository
            .updateById(params.transactionId, { needsEmbedding: true })
            .then(() => embeddingProgressStore.refresh())
            .catch(emptyFn);
    };

    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        aiLog('embed:defer:markMany', { count: ids.length, transactionIds: ids });

        Promise.all(ids.map(id => transactionRepository.updateById(id, { needsEmbedding: true })))
            .then(() => embeddingProgressStore.refresh())
            .catch(emptyFn);
    };

    return { markForEmbedding, markManyForEmbedding };
};
