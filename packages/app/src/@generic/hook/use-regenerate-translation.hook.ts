import { TranslationLlmService, TranslationResultInterface } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useAi } from '../../ai/hook/use-ai.hook';

type UpdateTranslationFn = (id: number, titleEn: string, titleTags: string) => Promise<void>;

export interface UseRegenerateTranslationReturn {
    readonly regenerate: (entityId: number, title: string) => Promise<TranslationResultInterface | null>;
    readonly isRegenerating: boolean;
    readonly error: string | null;
}

export const useRegenerateTranslation = (updateTranslation: UpdateTranslationFn): UseRegenerateTranslationReturn => {
    const { llm } = useAi();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = async (entityId: number, title: string): Promise<TranslationResultInterface | null> => {
        if (!llm.isReady) {
            setError(t`LLM not ready`);

            return null;
        }

        setIsRegenerating(true);
        setError(null);

        try {
            const service = new TranslationLlmService(llm);
            const result = await service.translate(title);
            await updateTranslation(entityId, result.titleEn, result.titleTags);

            return result;
        } catch (regenerateError: unknown) {
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
