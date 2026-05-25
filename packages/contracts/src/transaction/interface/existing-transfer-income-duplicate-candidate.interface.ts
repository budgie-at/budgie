export interface ExistingTransferIncomeDuplicateCandidateInterface {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_APPROXIMATE_INCOME_DUPLICATE' | 'AUTO_EXISTING_TRANSFER_INCOME_DUPLICATE';
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly targetAccountId: number;
    readonly targetAccountTitle: string;
    readonly existingTransferTargetEntryId: number;
    readonly sourceAmount: number;
    readonly existingTransferTargetAmount: number;
    readonly amount: number;
    readonly exchangeRate: number;
    readonly amountDelta: number;
    readonly timeDiff: number;
}
