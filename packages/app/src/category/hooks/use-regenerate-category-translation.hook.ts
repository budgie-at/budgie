import { t } from '@lingui/core/macro';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../../ai/context/llm.context';
import { generateTranslationAndTags } from '../../ai/util/generate-translation-and-tags.util';

interface RegenerateResult {
    titleEn: string;
    titleTags: string;
}

interface UseRegenerateCategoryTranslationReturn {
    regenerate: (categoryId: number, title: string) => Promise<RegenerateResult | null>;
    isRegenerating: boolean;
    error: string | null;
}

export const useRegenerateCategoryTranslation = (): UseRegenerateCategoryTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const regenerate = useCallback(
        async (categoryId: number, title: string): Promise<RegenerateResult | null> => {
            if (!llm.isReady) {
                setError(t`LLM not ready`);

                return null;
            }

            setIsRegenerating(true);
            setError(null);

            try {
                const result = await generateTranslationAndTags(llm, title);
                await categoryRepository.updateTranslation(categoryId, result.titleEn, result.titleTags);

                return result;
            } catch (regenerateError: unknown) {
                setError(getErrorMessage(regenerateError));

                return null;
            } finally {
                setIsRegenerating(false);
            }
        },
        [llm]
    );

    return { regenerate, isRegenerating, error };
};
