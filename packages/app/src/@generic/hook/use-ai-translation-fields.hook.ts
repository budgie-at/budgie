import { TranslationResultInterface } from '@budgie/ai';
import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useNoteInputModal } from '../../transaction/context/note-input-modal.context';

interface AiTranslationEntity {
    title: string;
    titleEn: string | null;
    titleTags: string | null;
}

type RegenerateFn = (entityId: number, title: string) => Promise<TranslationResultInterface | null>;

interface UseAiTranslationFieldsParams {
    entity: AiTranslationEntity | null;
    entityId: number;
    currentTitle: string;
    regenerate: RegenerateFn;
    isRegenerating: boolean;
    isModelReady: boolean;
}

interface UseAiTranslationFieldsReturn {
    titleEn: string | null;
    titleTags: string | null;
    handleTitleBlur: () => void;
    translationFieldsProps: {
        titleEn: string | null;
        titleTags: string | null;
        disabled: boolean;
        onRegenerate: () => Promise<void>;
        onTitleEnPress: () => Promise<void>;
        onTitleTagsPress: () => Promise<void>;
    };
}

export const useAiTranslationFields = (params: UseAiTranslationFieldsParams): UseAiTranslationFieldsReturn => {
    const { entity, entityId, currentTitle, regenerate, isRegenerating, isModelReady } = params;

    const [openNoteInput] = useNoteInputModal();
    const [titleEn, setTitleEn] = useState<string | null>(entity?.titleEn ?? null);
    const [titleTags, setTitleTags] = useState<string | null>(entity?.titleTags ?? null);

    const lastRegeneratedTitle = useRef<string>(entity?.title ?? '');

    const isGenerateDisabled = !isNotEmptyString(currentTitle);

    const handleRegenerate = async (): Promise<void> => {
        if (!isModelReady) {
            return;
        }

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

        if (titleChanged && hasValidTitle && !isRegenerating && isModelReady) {
            void handleRegenerate();
        }
    };

    const handleTitleEnPress = async (): Promise<void> => {
        const result = await openNoteInput({ initialValue: titleEn ?? '' });
        if (isDefined(result)) {
            setTitleEn(result);
        }
    };

    const handleTitleTagsPress = async (): Promise<void> => {
        const result = await openNoteInput({ initialValue: titleTags ?? '' });
        if (isDefined(result)) {
            setTitleTags(result);
        }
    };

    const translationFieldsProps = {
        titleEn,
        titleTags,
        disabled: isGenerateDisabled,
        onRegenerate: handleRegenerate,
        onTitleEnPress: handleTitleEnPress,
        onTitleTagsPress: handleTitleTagsPress
    };

    return { titleEn, titleTags, handleTitleBlur, translationFieldsProps };
};
