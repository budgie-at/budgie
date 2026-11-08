import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { VoiceReviewStepEnum } from '../enum/voice-review-step.enum';

export const useVoiceReviewStepNavigation = (setCategory: (rowId: string, categoryId: number) => void) => {
    const [step, setStep] = useState(VoiceReviewStepEnum.REVIEW);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    const handleShowReview = () => void setStep(VoiceReviewStepEnum.REVIEW);

    const handleShowCategory = () => void setStep(VoiceReviewStepEnum.CATEGORY);

    const handleShowCreate = () => void setStep(VoiceReviewStepEnum.CREATE_CATEGORY);

    const handleCategoryPress = (rowId: string) => {
        setEditingRowId(rowId);
        handleShowCategory();
    };

    const handleCategorySelect = (selectedCategoryId: number) => {
        if (isDefined(editingRowId)) {
            setCategory(editingRowId, selectedCategoryId);
        }
        handleShowReview();
    };

    return { step, editingRowId, handleShowReview, handleShowCategory, handleShowCreate, handleCategoryPress, handleCategorySelect };
};
