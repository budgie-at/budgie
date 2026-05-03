import { VoiceReviewActionTypeEnum } from '../enum/voice-review-action-type.enum';
import { VoiceReviewActionInterface } from '../interface/voice-review-action.interface';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

export const voiceReviewRowsReducer = (state: VoiceReviewRowInterface[], action: VoiceReviewActionInterface): VoiceReviewRowInterface[] => {
    if (action.type === VoiceReviewActionTypeEnum.EDIT_AMOUNT) {
        return state.map(row => (row.id === action.id ? { ...row, amount: action.amount } : row));
    }
    if (action.type === VoiceReviewActionTypeEnum.SET_CATEGORY) {
        return state.map(row => (row.id === action.id ? { ...row, categoryId: action.categoryId } : row));
    }

    return state.filter(row => row.id !== action.id);
};
