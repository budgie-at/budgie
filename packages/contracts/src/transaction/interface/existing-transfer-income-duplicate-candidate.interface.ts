export interface ExistingTransferIncomeDuplicateCandidateInterface {
    readonly confidenceBucket:
        | 'AUTO_EXISTING_TRANSFER_APPROXIMATE_INCOME_DUPLICATE'
        | 'AUTO_EXISTING_TRANSFER_CSV_ARCHIVED_SOURCE_EXPENSE_DUPLICATE'
        | 'AUTO_EXISTING_TRANSFER_CSV_INACTIVE_SOURCE_EXPENSE_DUPLICATE'
        | 'AUTO_EXISTING_TRANSFER_CSV_INACTIVE_TARGET_INCOME_DUPLICATE'
        | 'AUTO_EXISTING_TRANSFER_INACTIVE_TARGET_INCOME_DUPLICATE'
        | 'AUTO_EXISTING_TRANSFER_INCOME_DUPLICATE';
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly duplicateTransactionId: number;
    readonly duplicateTransactionTitle: string | null;
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
