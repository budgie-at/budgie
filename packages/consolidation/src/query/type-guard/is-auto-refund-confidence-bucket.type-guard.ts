import type { RefundAutoConfidenceBucket, RefundReviewCandidateInterface } from '@budgie/contracts';

export const isAutoRefundConfidenceBucket = (
    bucket: RefundReviewCandidateInterface['confidenceBucket']
): bucket is RefundAutoConfidenceBucket => bucket !== 'REVIEW_REFUND_PREFIX_TITLE_MCC';
