import { CategoryRepository, TagRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { TranslationProgressStore } from '../store/translation-progress.store';

import { TranslationDrainerService } from './translation-drainer.service';

export class AiTranslationStatusService extends Context.Service<AiTranslationStatusService>()('@budgie/app/AiTranslationStatusService', {
    make: Effect.gen(function* () {
        const categoryRepository = yield* CategoryRepository;
        const tagRepository = yield* TagRepository;
        const translationDrainerService = yield* TranslationDrainerService;
        const translationProgressStore = yield* TranslationProgressStore;

        return {
            rebuild: Effect.fn('AiTranslationStatusService.rebuild')(
                function* () {
                    yield* translationDrainerService.pause();
                    yield* Effect.ensuring(
                        Effect.all([categoryRepository.resetAllTranslations(), tagRepository.resetAllTranslations()]),
                        translationDrainerService.resume()
                    );
                    yield* translationProgressStore.refresh();
                    yield* translationDrainerService.boost();
                },
                effect => Effect.onError(effect, () => translationDrainerService.resume())
            )
        };
    })
}) {
    static readonly layer = Layer.effect(AiTranslationStatusService, AiTranslationStatusService.make).pipe(
        Layer.provide([CategoryRepository.layer, TagRepository.layer, TranslationDrainerService.layer, TranslationProgressStore.layer])
    );
}
