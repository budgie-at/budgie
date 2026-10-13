export interface ExistingTransferBridgeCandidateInterface {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_BRIDGE';
    readonly sourceExpenseTransactionId: number;
    readonly sourceExpenseTransactionTitle: string | null;
    readonly sourceExpenseEntryToIban: string | null;
    readonly bridgeIncomeTransactionId: number;
    readonly bridgeIncomeTransactionTitle: string | null;
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly operatedAt: number;
    readonly sourceAccountId: number;
    readonly bridgeAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly exchangeRate: number;
    readonly timeDiff: number;
}
