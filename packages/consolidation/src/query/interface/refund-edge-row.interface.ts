import type { RefundReviewCandidateInterface } from '@budgie/contracts';

export interface RefundEdgeRowInterface {
    readonly accountId: number;
    readonly confidenceBucket: RefundReviewCandidateInterface['confidenceBucket'];
    readonly matchType: RefundReviewCandidateInterface['matchType'];
    readonly expenseTransactionId: number;
    readonly expenseSyncId: string | null;
    readonly expenseOperatedAt: number;
    readonly expenseAutoNormTitle: string;
    readonly expenseAmount: number;
    readonly expenseAbsorbedAmount: number;
    readonly expenseOriginalMinorAmount: number;
    readonly feeAmount: number | null;
    readonly isExpenseClosed: number;
    readonly isPrivatbankOriginalMatch: number;
    readonly refundTransactionId: number;
    readonly refundSyncId: string | null;
    readonly refundOperatedAt: number;
    readonly refundAutoNormTitle: string;
    readonly refundAmount: number;
    readonly refundOriginalMinorAmount: number;
    readonly refundBaseAmount: number | null;
    readonly refundHasTags: number;
    readonly isRefundAutoPairDisabled: number;
}
