export interface RefundReviewCandidateInterface {
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundsTotal: number;
}
