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

    const handleNoteEdit = (current: string | null, setField: (value: string | null) => void) => async (): Promise<void> => {
        const result = await openNoteInput({ initialValue: current ?? '' });
        if (isDefined(result)) {
            setField(result);
        }
    };

    const translationFieldsProps = {
        titleEn,
        titleTags,
        disabled: isGenerateDisabled,
        onRegenerate: handleRegenerate,
        onTitleEnPress: handleNoteEdit(titleEn, setTitleEn),
        onTitleTagsPress: handleNoteEdit(titleTags, setTitleTags)
    };

    return { titleEn, titleTags, handleTitleBlur, translationFieldsProps };
};
