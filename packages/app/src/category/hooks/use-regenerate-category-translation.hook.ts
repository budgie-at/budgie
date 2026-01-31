import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useLlmContext } from '../../ai/context/llm.context';
import { CategoryLlmService, CategoryTranslationResult } from '../../ai/service/category-llm.service';

interface UseRegenerateCategoryTranslationReturn {
    regenerate: (categoryId: number, title: string) => Promise<CategoryTranslationResult | null>;
    isRegenerating: boolean;
    error: string | null;
}

export const useRegenerateCategoryTranslation = (): UseRegenerateCategoryTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = async (categoryId: number, title: string): Promise<CategoryTranslationResult | null> => {
        if (!llm.isReady) {
            setError(t`LLM not ready`);

            return null;
        }

        setIsRegenerating(true);
        setError(null);

        try {
            const service = new CategoryLlmService(llm);

            return await service.regenerateOne(categoryId, title);
        } catch (regenerateError: unknown) {
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
