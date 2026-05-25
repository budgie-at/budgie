import type { RefundCandidateBaseRowInterface } from './refund-candidate-base-row.interface';
import type { RefundReviewCandidateInterface } from './refund-review-candidate.interface';
import type { RefundReviewConfidenceBucket } from './refund-review-confidence-bucket.type';

export interface RefundReviewCandidateRowInterface extends RefundCandidateBaseRowInterface {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly matchType: RefundReviewCandidateInterface['matchType'];
}
