export interface IbanBridgeChainTransferCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_CHAIN_TRANSFER';
    readonly sourceExpenseTransactionId: number;
    readonly sourceExpenseTransactionTitle: string | null;
    readonly sourceExpenseEntryToIban: string;
    readonly bridgeIncomeTransactionId: number;
    readonly bridgeIncomeTransactionTitle: string | null;
    readonly bridgeExpenseTransactionId: number;
    readonly bridgeExpenseTransactionTitle: string | null;
    readonly targetIncomeTransactionId: number;
    readonly targetIncomeTransactionTitle: string | null;
    readonly operatedAt: number;
    readonly sourceAccountId: number;
    readonly bridgeAccountId: number;
    readonly targetAccountId: number;
    readonly sourceAmount: number;
    readonly bridgeAmount: number;
    readonly targetAmount: number;
    readonly exchangeRate: number;
    readonly timeDiff: number;
}
