export interface InzhurPendingTopUpInterface {
    readonly transactionId: number;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly spentAmount: number;
    readonly remainingAmount: number;
}
