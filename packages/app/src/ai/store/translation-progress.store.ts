import * as Effect from 'effect/Effect';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';

import { ProgressStore } from './progress.store';

export const translationProgressStore = new ProgressStore(
    Effect.all(
        [
            categoryRepository.countAll(),
            tagRepository.countAll(),
            categoryRepository.countUntranslated(),
            tagRepository.countUntranslated()
        ],
        {
            concurrency: 'unbounded'
        }
    ).pipe(
        Effect.map(([categoryAll, tagAll, categoryPending, tagPending]) => [categoryAll + tagAll, categoryPending + tagPending] as const)
    ),
    0
);
