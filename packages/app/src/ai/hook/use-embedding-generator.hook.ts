import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { embeddingProgressStore } from '../store/embedding-progress.store';

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
            Effect.ignore(Effect.andThen(transactionRepository.markForEmbeddingByIds(ids), embeddingProgressStore.refresh()))
        );
    };

    const markForEmbedding = (transactionId: number): void => {
        markManyForEmbedding([transactionId]);
    };

    return { markForEmbedding, markManyForEmbedding };
};
