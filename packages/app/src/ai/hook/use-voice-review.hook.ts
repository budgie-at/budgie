import { useReducer, useState } from 'react';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { VoiceReviewActionTypeEnum } from '../enum/voice-review-action-type.enum';
import { UseVoiceReviewReturnInterface } from '../interface/use-voice-review-return.interface';
import { VoiceReviewActionInterface } from '../interface/voice-review-action.interface';
import { VoiceReviewCreateResultInterface } from '../interface/voice-review-create-result.interface';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';
import { voiceReviewBatchCreateService } from '../service/voice-review-batch-create.service';

const reducer = (state: VoiceReviewRowInterface[], action: VoiceReviewActionInterface): VoiceReviewRowInterface[] => {
    if (action.type === VoiceReviewActionTypeEnum.EDIT_AMOUNT) {
        return state.map(row => (row.id === action.id ? { ...row, amount: action.amount } : row));
    }
    if (action.type === VoiceReviewActionTypeEnum.SET_CATEGORY) {
        return state.map(row => (row.id === action.id ? { ...row, categoryId: action.categoryId } : row));
    }

    return state.filter(row => row.id !== action.id);
};

export const useVoiceReview = (initialRows: VoiceReviewRowInterface[]): UseVoiceReviewReturnInterface => {
    const [rows, dispatch] = useReducer(reducer, initialRows);
    const [isSaving, setIsSaving] = useState(false);

    const editAmount = (id: string, amount: number) => {
        dispatch({ type: VoiceReviewActionTypeEnum.EDIT_AMOUNT, id, amount });
    };
    const setCategory = (id: string, categoryId: number) => {
        dispatch({ type: VoiceReviewActionTypeEnum.SET_CATEGORY, id, categoryId });
    };
    const deleteRow = (id: string) => {
        dispatch({ type: VoiceReviewActionTypeEnum.DELETE, id });
    };

    const hasInvalidAmounts = rows.some(row => !isPositiveNumber(row.amount));
    const hasMissingCategories = rows.some(row => !isPositiveNumber(row.categoryId));
    const canSave = isNotEmptyArray(rows) && !hasInvalidAmounts && !hasMissingCategories;

    const saveAll = async (accountId: number): Promise<VoiceReviewCreateResultInterface | null> => {
        setIsSaving(true);
        try {
            return await voiceReviewBatchCreateService.create(rows, accountId);
        } catch {
            setIsSaving(false);

            return null;
        }
    };

    return { rows, isSaving, canSave, hasInvalidAmounts, hasMissingCategories, editAmount, setCategory, deleteRow, saveAll };
};
