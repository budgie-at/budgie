import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useLlmContext } from '../../ai/context/llm.context';
import { CategoryTranslationResult } from '../../ai/service/category-llm.service';
import { TagLlmService } from '../../ai/service/tag-llm.service';

interface UseRegenerateTagTranslationReturn {
    regenerate: (tagId: number, title: string) => Promise<CategoryTranslationResult | null>;
    isRegenerating: boolean;
    error: string | null;
}

export const useRegenerateTagTranslation = (): UseRegenerateTagTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = async (tagId: number, title: string): Promise<CategoryTranslationResult | null> => {
        if (!llm.isReady) {
            setError(t`LLM not ready`);

            return null;
        }

        setIsRegenerating(true);
        setError(null);

        try {
            const service = new TagLlmService(llm);

            return await service.regenerateOne(tagId, title);
        } catch (regenerateError: unknown) {
            setError(getErrorMessage(regenerateError));

            return null;
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerate, isRegenerating, error };
};
