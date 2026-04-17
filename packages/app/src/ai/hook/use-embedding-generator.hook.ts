import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

import { useAi } from './use-ai.hook';

interface MarkParamsInterface {
    readonly transactionId: number;
}

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (params: MarkParamsInterface) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
}

const handleMarkError = (): void => {
    // intentionally empty - best-effort flag update; drainer will rediscover row if this misses
};

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const { refreshProgress } = useAi();

    const markForEmbedding = (params: MarkParamsInterface): void => {
        transactionRepository.updateById(params.transactionId, { needsEmbedding: true }).then(refreshProgress).catch(handleMarkError);
    };

    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        Promise.all(ids.map(id => transactionRepository.updateById(id, { needsEmbedding: true })))
            .then(refreshProgress)
            .catch(handleMarkError);
    };

    return { markForEmbedding, markManyForEmbedding };
};
