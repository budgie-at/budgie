import { CategoryLlmService, TagLlmService } from '@budgie/ai';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../../ai/context/llm.context';

interface UseRegenerateAllCategoriesReturn {
    regenerateAll: () => Promise<void>;
    isRegenerating: boolean;
}

export const useRegenerateAllCategories = (): UseRegenerateAllCategoriesReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);

    // eslint-disable-next-line max-statements -- Orchestrates sequential category and tag translation
    const regenerateAll = async (): Promise<void> => {
        if (!llm.isReady || isRegenerating) {
            return;
        }

        setIsRegenerating(true);

        try {
            const categoryService = new CategoryLlmService(llm);
            const categories = await categoryRepository.findAllNonSystem();

            /* eslint-disable no-await-in-loop -- Sequential processing to avoid overwhelming LLM */
            for (const category of categories) {
                const result = await categoryService.translate(category.title);
                await categoryRepository.updateTranslation(category.id, result.titleEn, result.titleTags);
            }

            const tagService = new TagLlmService(llm);
            const tags = await tagRepository.findAll();

            for (const tag of tags) {
                const result = await tagService.translate(tag.title);
                await tagRepository.updateTranslation(tag.id, result.titleEn, result.titleTags);
            }
            /* eslint-enable no-await-in-loop */
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Failed to regenerate category translations`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    return { regenerateAll, isRegenerating };
};
