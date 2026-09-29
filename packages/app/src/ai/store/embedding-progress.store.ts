import * as Effect from 'effect/Effect';

import { transactionEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';

import { ProgressStore } from './progress.store';

export const embeddingProgressStore = new ProgressStore(
    Effect.all([transactionRepository.countAllActive(), transactionEmbeddingRepository.countPending()]),
    1000
);
