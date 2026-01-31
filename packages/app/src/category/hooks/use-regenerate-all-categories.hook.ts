import { t } from '@lingui/core/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { useLlmContext } from '../../ai/context/llm.context';
import { CategoryLlmService } from '../../ai/service/category-llm.service';

interface UseRegenerateAllCategoriesReturn {
    regenerateAll: () => Promise<void>;
    isRegenerating: boolean;
}

export const useRegenerateAllCategories = (): UseRegenerateAllCategoriesReturn => {
    const { llm } = useLlmContext();
    const [isRegenerating, setIsRegenerating] = useState(false);

    const regenerateAll = async (): Promise<void> => {
        if (!llm.isReady || isRegenerating) {
            return;
        }

        setIsRegenerating(true);

        try {
            const service = new CategoryLlmService(llm);
            await service.regenerateAll();
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
