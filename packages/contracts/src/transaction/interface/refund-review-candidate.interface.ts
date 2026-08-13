import type { RefundCandidateBaseInterface } from './refund-candidate-base.interface';
import type { RefundCandidateInterface } from './refund-candidate.interface';
import type { RefundReviewConfidenceBucket } from './refund-review-confidence-bucket.type';

export interface RefundReviewCandidateInterface extends RefundCandidateBaseInterface {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly matchType: RefundCandidateInterface['matchType'] | 'prefix-title-mcc';
}
