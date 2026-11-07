export interface InzhurManualPurchaseInputInterface {
    readonly topUpTransactionId: number;
    readonly fundName: string;
    readonly certificates: number;
    readonly amount: number;
    readonly operatedAt: Date;
}
