import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CategoryTranslationResult } from '../../ai/service/category-llm.service';

interface AiTranslationEntity {
    title: string;
    titleEn: string | null;
    titleTags: string | null;
}

type RegenerateFn = (entityId: number, title: string) => Promise<CategoryTranslationResult | null>;

interface UseAiTranslationFieldsParams {
    entity: AiTranslationEntity | null;
    entityId: number;
    currentTitle: string;
    regenerate: RegenerateFn;
    isRegenerating: boolean;
}

interface UseAiTranslationFieldsReturn {
    titleEn: string | null;
    titleTags: string | null;
    isGenerateDisabled: boolean;
    handleRegenerate: () => Promise<void>;
    handleTitleBlur: () => void;
}

export const useAiTranslationFields = (params: UseAiTranslationFieldsParams): UseAiTranslationFieldsReturn => {
    const { entity, entityId, currentTitle, regenerate, isRegenerating } = params;

    const [titleEn, setTitleEn] = useState<string | null>(entity?.titleEn ?? null);
    const [titleTags, setTitleTags] = useState<string | null>(entity?.titleTags ?? null);

    const lastRegeneratedTitle = useRef<string>(entity?.title ?? '');

    const isGenerateDisabled = !isNotEmptyString(currentTitle);

    const handleRegenerate = async (): Promise<void> => {
        const result = await regenerate(entityId, currentTitle);

        if (isDefined(result)) {
            setTitleEn(result.titleEn);
            setTitleTags(result.titleTags);
            lastRegeneratedTitle.current = currentTitle;
        }
    };

    const handleTitleBlur = (): void => {
        const titleChanged = currentTitle !== lastRegeneratedTitle.current;
        const hasValidTitle = isNotEmptyString(currentTitle);

        if (titleChanged && hasValidTitle && !isRegenerating) {
            void handleRegenerate();
        }
    };

    return { titleEn, titleTags, isGenerateDisabled, handleRegenerate, handleTitleBlur };
};
