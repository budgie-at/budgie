export interface IbanBridgeTransferCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_TRANSFER';
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly operatedAt: number;
    readonly expenseEntryToIban: string;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly bridgeAccountId: number;
    readonly bridgeAmount: number;
    readonly sourceAccountId: number;
    readonly sourceAmount: number;
    readonly targetAccountId: number;
    readonly exchangeRate: number;
    readonly timeDiff: number;
}
