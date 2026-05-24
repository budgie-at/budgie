export interface ExistingTransferIncomeDuplicateCandidateInterface {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_INCOME_DUPLICATE';
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly targetAccountId: number;
    readonly targetAccountTitle: string;
    readonly amount: number;
    readonly timeDiff: number;
}
