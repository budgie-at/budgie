import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import * as Equal from 'effect/Equal';
import * as Atom from 'effect/reactivity/Atom';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { EMPTY_SUBSYSTEM_SNAPSHOT } from '../constant/empty-subsystem-snapshot.constant';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { translationProgressStore } from '../store/translation-progress.store';
import { buildSubsystemSnapshot } from '../utils/build-subsystem-snapshot.util';

import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { translationDrainerService } from './translation-drainer.service';

class AiTranslationStatusService {
    readonly snapshot = Atom.make(get =>
        get(aiUmbrellaStatusService.snapshot).state === AiSystemUmbrellaStateEnum.HEALTHY
            ? buildSubsystemSnapshot(get(translationDrainerService.snapshot), get(translationProgressStore.snapshot), {
                  boosting: t`Rebuilding translations`,
                  working: t`Translating categories and tags`,
                  ready: t`Translations ready`
              })
            : EMPTY_SUBSYSTEM_SNAPSHOT
    ).pipe(Atom.withEquality(Equal.equals));

    readonly rebuild = Effect.fn('AiTranslationStatusService.rebuild')(
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
    );
}

export const aiTranslationStatusService = new AiTranslationStatusService();
