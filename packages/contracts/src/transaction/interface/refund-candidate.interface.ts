import type { RefundAutoConfidenceBucket } from './refund-auto-confidence-bucket.type';

export interface RefundCandidateInterface {
    readonly confidenceBucket: RefundAutoConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly expenseOperatedAt: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundIncomeAmounts: number[];
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
}
