export interface IbanBridgeChainTransferCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_CHAIN_TRANSFER';
    readonly sourceExpenseTransactionId: number;
    readonly sourceExpenseTransactionTitle: string | null;
    readonly sourceExpenseTransactionComment: string | null;
    readonly sourceExpenseEntryId: number;
    readonly sourceExpenseEntryToIban: string;
    readonly bridgeIncomeTransactionId: number;
    readonly bridgeIncomeTransactionTitle: string | null;
    readonly bridgeIncomeEntryId: number;
    readonly bridgeExpenseTransactionId: number;
    readonly bridgeExpenseTransactionTitle: string | null;
    readonly bridgeExpenseEntryId: number;
    readonly targetIncomeTransactionId: number;
    readonly targetIncomeTransactionTitle: string | null;
    readonly targetIncomeEntryId: number;
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
