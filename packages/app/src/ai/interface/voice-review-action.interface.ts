import { VoiceReviewActionTypeEnum } from '../enum/voice-review-action-type.enum';

export type VoiceReviewActionInterface =
    | { readonly type: VoiceReviewActionTypeEnum.EDIT_AMOUNT; readonly id: string; readonly amount: number }
    | { readonly type: VoiceReviewActionTypeEnum.SET_CATEGORY; readonly id: string; readonly categoryId: number }
    | { readonly type: VoiceReviewActionTypeEnum.DELETE; readonly id: string };
