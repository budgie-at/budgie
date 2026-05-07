export interface RefundCandidateRowInterface {
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundsTotal: number;
}
