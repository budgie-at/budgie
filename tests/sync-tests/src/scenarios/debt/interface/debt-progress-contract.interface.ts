export interface DebtProgressContractInterface {
    readonly outstandingAmount: number;
    readonly overpaidAmount?: number;
    readonly paidAmount: number;
    readonly percentage: number;
    readonly totalAmount: number;
}
