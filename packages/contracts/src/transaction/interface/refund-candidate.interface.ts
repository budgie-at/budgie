import type { RefundAutoConfidenceBucket } from './refund-auto-confidence-bucket.type';
import type { RefundCandidateBaseInterface } from './refund-candidate-base.interface';

export interface RefundCandidateInterface extends RefundCandidateBaseInterface {
    readonly confidenceBucket: RefundAutoConfidenceBucket;
    readonly matchType: 'exact-title' | 'localized-cancellation-title';
}
