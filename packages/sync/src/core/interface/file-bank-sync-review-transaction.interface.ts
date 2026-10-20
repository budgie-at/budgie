export interface FileBankSyncReviewTransactionInterface {
    readonly externalId: string;
    readonly operatedAt: Date;
    readonly description: string;
    readonly signedAmount: number;
    readonly currencyCode: string;
}
