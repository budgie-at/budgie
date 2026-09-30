import { TransactionEmbeddingRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (transactionId: number) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
}

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        appRuntime.runFork(
            Effect.ignore(
                Effect.gen(function* () {
                    const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
                    const embeddingProgressStore = yield* EmbeddingProgressStore;

                    yield* transactionEmbeddingRepository.markForEmbeddingByIds(ids);
                    yield* embeddingProgressStore.refresh();
                })
            )
        );
    };

    const markForEmbedding = (transactionId: number): void => {
        markManyForEmbedding([transactionId]);
    };

    return { markForEmbedding, markManyForEmbedding };
};
