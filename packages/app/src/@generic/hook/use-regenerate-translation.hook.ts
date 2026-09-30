import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../../ai/enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { chatService } from '../../ai/service/chat.service';
import { appRuntime } from '../runtime/app.runtime';

import type { Db } from '@budgie/contracts';

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Effect.Effect<unknown, unknown, Db>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
    readonly error: string | null;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        setIsRegenerating(true);
        setError(null);

        return appRuntime.runPromise(
            Effect.acquireUseRelease(
                aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT),
                isChatReady =>
                    Effect.gen(function* () {
                        if (!isChatReady) {
                            setError(t`LLM not ready`);

                            return null;
                        }

                        const result = yield* new TranslationLlmService(chatService).translate(title);
                        yield* updateTranslation(entityId, result.titleEn, result.titleTags);

                        return result;
                    }),
                () => aiModelResidencyService.release(AiSubsystemNameEnum.CHAT)
            ).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catchCause(cause =>
                    Effect.sync(() => {
                        setError(getErrorMessage(Cause.squash(cause)));

                        return null;
                    })
                ),
                Effect.ensuring(Effect.sync(() => void setIsRegenerating(false)))
            )
        );
    };

    return { regenerate, isRegenerating, error };
};
