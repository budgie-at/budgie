import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useLlmContext } from '../../ai/context/llm.context';

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Promise<void>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
    readonly error: string | null;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = async (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        console.log('[REGEN] regenerate called:', { entityId, title, isReady: llm.isReady }); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        if (!llm.isReady) {
            console.log('[REGEN] LLM not ready, aborting'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setError(t`LLM not ready`);

            return null;
        }

        setIsRegenerating(true);
        setError(null);

        try {
            const service = new TranslationLlmService(llm);
            console.log('[REGEN] Calling translate...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            const result = await service.translate(title);
            console.log('[REGEN] Translation result:', result); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            await updateTranslation(entityId, result.titleEn, result.titleTags);

            return result;
        } catch (regenerateError: unknown) {
            console.log('[REGEN] Error:', getErrorMessage(regenerateError)); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
