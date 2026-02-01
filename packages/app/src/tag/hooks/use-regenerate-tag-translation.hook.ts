import { t } from '@lingui/core/macro';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { useLlmContext } from '../../ai/context/llm.context';
import { TranslationResult } from '../../ai/service/base-llm.service';
import { TagLlmService } from '../../ai/service/tag-llm.service';

interface UseRegenerateTagTranslationReturn {
    regenerate: (tagId: number, title: string) => Promise<TranslationResult | null>;
    isRegenerating: boolean;
    error: string | null;
}

export const useRegenerateTagTranslation = (): UseRegenerateTagTranslationReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* jscpd:ignore-start - Mirrors category regeneration hook pattern */
    const regenerate = async (tagId: number, title: string): Promise<TranslationResult | null> => {
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

    /* jscpd:ignore-end */
    return { regenerate, isRegenerating, error };
};
