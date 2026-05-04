import type { RefundAutoConfidenceBucket } from './refund-auto-confidence-bucket.type';

export interface RefundCandidateRowInterface {
    readonly confidenceBucket: RefundAutoConfidenceBucket;
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly expenseOperatedAt: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundIncomeAmounts: string;
    readonly refundsTotal: number;
    readonly maxTimeDiffSeconds: number;
}
