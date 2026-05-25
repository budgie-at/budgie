export interface RefundCandidateBaseRowInterface {
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: string;
    readonly refundsTotal: number;
}
