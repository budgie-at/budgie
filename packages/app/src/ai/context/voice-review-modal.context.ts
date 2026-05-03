import { AITransactionInterface } from '@budgie/ai';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface VoiceReviewModalParams {
    readonly transactions: AITransactionInterface[];
    readonly originalText: string;
}

export type VoiceReviewModalResult = 'saved' | 're-record' | 'cancelled';

export const [VoiceReviewModalContext, useVoiceReviewModal] = createModalContext<VoiceReviewModalParams, VoiceReviewModalResult>(
    'cancelled'
);
