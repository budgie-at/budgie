import * as Effect from 'effect/Effect';
import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useNoteInputModal } from '../../transaction/context/note-input-modal.context';
import { appRuntime } from '../runtime/app.runtime';

import type { UseRegenerateTranslationReturn } from './use-regenerate-translation.hook';

interface AiTranslationEntity {
    title: string;
    titleEn: string | null;
    titleTags: string | null;
}

interface UseAiTranslationFieldsParams {
    entity: AiTranslationEntity | null;
    entityId: number;
    currentTitle: string;
    regenerate: UseRegenerateTranslationReturn['regenerate'];
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
        onTitleEnPress: () => void;
        onTitleTagsPress: () => void;
    };
}

export const useAiTranslationFields = (params: UseAiTranslationFieldsParams): UseAiTranslationFieldsReturn => {
    const { entity, entityId, currentTitle, regenerate, isRegenerating, isModelReady } = params;

    const [openNoteInput] = useNoteInputModal();
    const [titleEn, setTitleEn] = useState<string | null>(entity?.titleEn ?? null);
    const [titleTags, setTitleTags] = useState<string | null>(entity?.titleTags ?? null);

    const lastRegeneratedTitle = useRef<string>(entity?.title ?? '');

    const handleRegenerate = (): void => {
        if (!isModelReady) {
            return;
        }

        appRuntime.runFork(
            regenerate(entityId, currentTitle).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        if (isDefined(result)) {
                            setTitleEn(result.titleEn);
                            setTitleTags(result.titleTags);
                            lastRegeneratedTitle.current = currentTitle;
                        }
                    })
                )
            )
        );
    };

    const handleTitleBlur = (): void => {
        const titleChanged = currentTitle !== lastRegeneratedTitle.current;
        const hasValidTitle = isNotEmptyString(currentTitle);

        if (titleChanged && hasValidTitle && !isRegenerating && isModelReady) {
            handleRegenerate();
        }
    };

    const handleNoteEdit = (current: string | null, setField: (value: string | null) => void) => (): void => {
        openNoteInput({ initialValue: current ?? '' }, result => {
            if (isDefined(result)) {
                setField(result);
            }
        });
    };

    const translationFieldsProps = {
        titleEn,
        titleTags,
        onTitleEnPress: handleNoteEdit(titleEn, setTitleEn),
        onTitleTagsPress: handleNoteEdit(titleTags, setTitleTags)
    };

    return { titleEn, titleTags, handleTitleBlur, translationFieldsProps };
};
