export interface IbanBridgeTransferCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_TRANSFER';
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseTransactionComment: string | null;
    readonly operatedAt: number;
    readonly expenseEntryId: number;
    readonly expenseEntryToIban: string;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly incomeEntryId: number;
    readonly incomeEntryToIban: string;
    readonly bridgeAccountId: number;
    readonly bridgeAccountTitle: string;
    readonly bridgeAmount: number;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly sourceAmount: number;
    readonly targetAccountId: number;
    readonly targetAccountTitle: string;
    readonly exchangeRate: number;
    readonly existingDirectTransferId: number | null;
    readonly timeDiff: number;
}
