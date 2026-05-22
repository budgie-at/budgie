export interface IbanBridgeCanonicalDuplicateCandidateInterface {
    readonly confidenceBucket: 'AUTO_IBAN_BRIDGE_CANONICAL_DUPLICATE';
    readonly expenseTransactionId: number;
    readonly incomeTransactionId: number;
    readonly existingCanonicalTransferId: number;
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly timeDiff: number;
}
