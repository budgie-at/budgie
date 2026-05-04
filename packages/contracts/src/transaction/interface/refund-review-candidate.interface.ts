import type { RefundReviewConfidenceBucket } from './refund-review-confidence-bucket.type';

export interface RefundReviewCandidateInterface {
    readonly confidenceBucket: RefundReviewConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundIncomeAmounts: number[];
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
}
