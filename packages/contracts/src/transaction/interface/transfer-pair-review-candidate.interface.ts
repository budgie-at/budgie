import type { TransferPairReviewConfidenceBucket } from './transfer-pair-review-confidence-bucket.type';

export interface TransferPairReviewCandidateInterface {
    readonly confidenceBucket: TransferPairReviewConfidenceBucket;
    readonly expenseTransactionId: number;
    readonly incomeTransactionId: number;
    readonly expenseAccountTitle: string;
    readonly incomeAccountTitle: string;
    readonly expenseCurrency: string;
    readonly incomeCurrency: string;
    readonly expenseEntryAmount: number;
    readonly incomeEntryAmount: number;
    readonly expenseOperationAmount: number;
    readonly incomeOperationAmount: number;
    readonly expenseTransactionTitle: string | null;
    readonly incomeTransactionTitle: string | null;
    readonly timeDiff: number;
}
