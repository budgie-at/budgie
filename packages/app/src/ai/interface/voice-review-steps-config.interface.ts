import type { VoiceReviewModalResult } from '../context/voice-review-modal.context';
import type { UseVoiceReviewReturnInterface } from './use-voice-review-return.interface';

export interface VoiceReviewStepsConfigInterface {
    readonly review: UseVoiceReviewReturnInterface;
    readonly originalText: string;
    readonly onCommit: (result: VoiceReviewModalResult) => void;
}
