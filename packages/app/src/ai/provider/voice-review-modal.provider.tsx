import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { VoiceReviewModalContext } from '../context/voice-review-modal.context';

import type { VoiceReviewModalParams, VoiceReviewModalResult } from '../context/voice-review-modal.context';

export const VoiceReviewModalProvider = createModalProvider<VoiceReviewModalParams, VoiceReviewModalResult>(
    VoiceReviewModalContext,
    '/voice-review'
);
