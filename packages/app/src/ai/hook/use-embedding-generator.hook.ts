import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

import { useAiProgress } from './use-ai-progress.hook';

interface MarkParamsInterface {
    readonly transactionId: number;
}

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (params: MarkParamsInterface) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
}

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const { refreshProgress } = useAiProgress();

    const markForEmbedding = (params: MarkParamsInterface): void => {
        transactionRepository.updateById(params.transactionId, { needsEmbedding: true }).then(refreshProgress).catch(emptyFn);
    };

    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        Promise.all(ids.map(id => transactionRepository.updateById(id, { needsEmbedding: true })))
            .then(refreshProgress)
            .catch(emptyFn);
    };

    return { markForEmbedding, markManyForEmbedding };
};
