export interface ExistingTransferChainReclaimCandidateInterface {
    readonly confidenceBucket: 'AUTO_EXISTING_TRANSFER_CHAIN_RECLAIM';
    readonly existingTransferId: number;
    readonly existingTransferTitle: string | null;
    readonly bridgeIncomeTransactionId: number;
    readonly bridgeIncomeTransactionTitle: string | null;
    readonly bridgeExpenseTransactionId: number;
    readonly bridgeExpenseTransactionTitle: string | null;
    readonly operatedAt: number;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly bridgeAccountId: number;
    readonly bridgeAccountTitle: string;
    readonly targetAccountId: number;
    readonly targetAccountTitle: string;
    readonly sourceAmount: number;
    readonly bridgeAmount: number;
    readonly targetAmount: number;
    readonly exchangeRate: number;
    readonly timeDiff: number;
}
