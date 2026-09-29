import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { AiSubsystemNameEnum } from '../../ai/enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../../ai/service/ai-model-residency.service';
import { chatService } from '../../ai/service/chat.service';
import { appRuntime } from '../runtime/app.runtime';

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Promise<void>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
    readonly error: string | null;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line max-statements -- Lifecycle-guarded translate with structured logging and error capture
    const regenerate = async (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        setIsRegenerating(true);
        setError(null);

        const isChatReady = await appRuntime.runPromise(aiModelResidencyService.acquire(AiSubsystemNameEnum.CHAT));

        try {
            if (!isChatReady) {
                setError(t`LLM not ready`);

                return null;
            }

            const service = new TranslationLlmService(chatService);
            const result = await appRuntime.runPromise(service.translate(title));
            await updateTranslation(entityId, result.titleEn, result.titleTags);

            return result;
        } catch (regenerateError: unknown) {
            appRuntime.runFork(Effect.logError('translation:regenerate:throw', { errorMessage: getErrorMessage(regenerateError) }));
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            void appRuntime.runPromise(aiModelResidencyService.release(AiSubsystemNameEnum.CHAT));
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
