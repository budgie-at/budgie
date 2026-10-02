import { CategoryRepository, TagRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { translationProgressSnapshotAtom } from '../constant/ai-snapshot-atoms.constant';

import { ProgressStore } from './progress.store';

export class TranslationProgressStore extends Context.Service<TranslationProgressStore>()('@budgie/app/TranslationProgressStore', {
    make: Effect.gen(function* () {
        const categoryRepository = yield* CategoryRepository;
        const tagRepository = yield* TagRepository;

        return new ProgressStore(
            translationProgressSnapshotAtom,
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
                Effect.map(
                    ([categoryAll, tagAll, categoryPending, tagPending]) => [categoryAll + tagAll, categoryPending + tagPending] as const
                )
            ),
            0
        );
    })
}) {
    static readonly layer = Layer.effect(TranslationProgressStore, TranslationProgressStore.make).pipe(
        Layer.provide([CategoryRepository.layer, TagRepository.layer])
    );
}
