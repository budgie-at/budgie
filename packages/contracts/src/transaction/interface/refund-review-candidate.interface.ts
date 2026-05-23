import type { RefundCandidateBaseInterface } from './refund-candidate-base.interface';
import type { RefundReviewConfidenceBucket } from './refund-review-confidence-bucket.type';

export interface RefundReviewCandidateInterface extends RefundCandidateBaseInterface {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly matchType: 'prefix-title-mcc';
}
