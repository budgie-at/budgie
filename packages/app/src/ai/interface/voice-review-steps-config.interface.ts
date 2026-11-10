import type { ModalResult } from '../../@generic/type/modal-result.type';
import type { UseVoiceReviewReturnInterface } from './use-voice-review-return.interface';

export interface VoiceReviewStepsConfigInterface {
    readonly review: UseVoiceReviewReturnInterface;
    readonly originalText: string;
    readonly onCommit: (result: ModalResult<'/voice-review'>) => void;
}
