import type { RefundAutoConfidenceBucket } from './refund-auto-confidence-bucket.type';
import type { RefundCandidateBaseRowInterface } from './refund-candidate-base-row.interface';
import type { RefundCandidateInterface } from './refund-candidate.interface';

export interface RefundCandidateRowInterface extends RefundCandidateBaseRowInterface {
    readonly confidenceBucket: RefundAutoConfidenceBucket;
    readonly matchType: RefundCandidateInterface['matchType'];
}
