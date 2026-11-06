export interface InzhurPendingTopUpInterface {
    readonly transactionId: number;
    readonly externalId: string;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly spentAmount: number;
    readonly remainingAmount: number;
}
