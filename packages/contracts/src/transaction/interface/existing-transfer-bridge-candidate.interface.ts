export interface ExistingTransferBridgeCandidateInterface {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_BRIDGE';
    readonly sourceExpenseTransactionId: number;
    readonly sourceExpenseTransactionTitle: string | null;
    readonly sourceExpenseTransactionComment: string | null;
    readonly sourceExpenseEntryId: number;
    readonly sourceExpenseEntryToIban: string | null;
    readonly bridgeIncomeTransactionId: number;
    readonly bridgeIncomeTransactionTitle: string | null;
    readonly bridgeIncomeEntryId: number;
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly operatedAt: number;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly bridgeAccountId: number;
    readonly bridgeAccountTitle: string;
    readonly targetAccountId: number;
    readonly targetAccountTitle: string;
    readonly sourceAmount: number;
    readonly targetAmount: number;
    readonly exchangeRate: number;
    readonly timeDiff: number;
}
