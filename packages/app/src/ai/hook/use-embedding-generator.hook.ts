import { EmbeddingIndexService, TransactionEmbeddingRepository } from '@budgie/categorization';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { EmbeddingProgressStore } from '../store/embedding-progress.store';

interface UseEmbeddingGeneratorReturnInterface {
    readonly markForEmbedding: (transactionId: number) => void;
    readonly markManyForEmbedding: (transactionIds: readonly number[]) => void;
    readonly learnCorrection: (transactionId: number, previousCategoryIds: number[]) => void;
}

export const useEmbeddingGenerator = (): UseEmbeddingGeneratorReturnInterface => {
    const refreshProgress = Effect.flatMap(EmbeddingProgressStore, embeddingProgressStore => embeddingProgressStore.refresh());

    const markManyForEmbedding = (transactionIds: readonly number[]): void => {
        const ids = [...transactionIds];

        if (!isNotEmptyArray(ids)) {
            return;
        }

        appRuntime.runFork(
            Effect.ignore(
                Effect.flatMap(TransactionEmbeddingRepository, repository => repository.markForEmbeddingByIds(ids)).pipe(
                    Effect.andThen(refreshProgress)
                )
            )
        );
    };

    const markForEmbedding = (transactionId: number): void => {
        markManyForEmbedding([transactionId]);
    };

    const learnCorrection = (transactionId: number, previousCategoryIds: number[]): void => {
        appRuntime.runFork(
            Effect.ignore(
                Effect.flatMap(EmbeddingIndexService, service => service.learnCorrection(transactionId, previousCategoryIds)).pipe(
                    Effect.andThen(refreshProgress)
                )
            )
        );
    };

    return { markForEmbedding, markManyForEmbedding, learnCorrection };
};
