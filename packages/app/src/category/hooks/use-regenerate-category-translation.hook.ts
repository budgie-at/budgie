import { CategoryLlmService, TranslationResultInterface } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../../ai/context/llm.context';

interface UseRegenerateCategoryTranslationReturn {
    regenerate: (categoryId: number, title: string) => Promise<TranslationResultInterface | null>;
    isRegenerating: boolean;
    error: string | null;
}

export const useRegenerateCategoryTranslation = (): UseRegenerateCategoryTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = async (categoryId: number, title: string): Promise<TranslationResultInterface | null> => {
        if (!llm.isReady) {
            setError(t`LLM not ready`);

            return null;
        }

        setIsRegenerating(true);
        setError(null);

        try {
            const service = new CategoryLlmService(llm);
            const result = await service.translate(title);
            await categoryRepository.updateTranslation(categoryId, result.titleEn, result.titleTags);

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
