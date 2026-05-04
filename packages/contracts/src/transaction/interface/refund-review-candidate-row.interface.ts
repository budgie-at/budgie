import type { RefundReviewConfidenceBucket } from './refund-review-confidence-bucket.type';

export interface RefundReviewCandidateRowInterface {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundIncomeAmounts: string;
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
}
