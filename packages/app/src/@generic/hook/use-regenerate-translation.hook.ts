import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { AiSubsystemNameEnum } from '../../ai/enum/ai-subsystem-name.enum';
import { AiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { appRuntime } from '../runtime/app.runtime';

import type { AppServices } from '../runtime/app.runtime';

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Effect.Effect<unknown, unknown, AppServices>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const [isRegenerating, setIsRegenerating] = useState(false);

    const regenerate = (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        setIsRegenerating(true);

        return appRuntime.runPromise(
            Effect.flatMap(AiModelResidencyService, aiModelResidencyService =>
                Effect.acquireUseRelease(
                    aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT),
                    isChatReady =>
                        Effect.gen(function* () {
                            if (!isChatReady) {
                                return null;
                            }

                            const translationLlmService = yield* TranslationLlmService;
                            const result = yield* translationLlmService.translate(title);
                            yield* updateTranslation(entityId, result.titleEn, result.titleTags);

                            return result;
                        }),
                    () => aiModelResidencyService.release(AiSubsystemNameEnum.CHAT)
                )
            ).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catchCause(() => Effect.succeed(null)),
                Effect.ensuring(Effect.sync(() => void setIsRegenerating(false)))
            )
        );
    };

    return { regenerate, isRegenerating };
};
