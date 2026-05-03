import { AITransactionInterface } from '@budgie/ai';

import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface VoiceReviewModalParams {
    readonly transactions: AITransactionInterface[];
    readonly originalText: string;
}

export type VoiceReviewModalResult =
    | { readonly kind: 'saved'; readonly transactionIds: number[]; readonly accountId: number }
    | { readonly kind: 're-record' }
    | { readonly kind: 'cancelled' };

export const [VoiceReviewModalContext, useVoiceReviewModal] = createModalContext<VoiceReviewModalParams, VoiceReviewModalResult>({
    kind: 'cancelled'
});
