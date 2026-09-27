export interface CategorizeInboxVisibilityInterface {
    readonly hiddenTransactionIds: ReadonlySet<number>;
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly hideTransactions: (transactionIds: readonly number[]) => void;
    readonly showTransactions: (transactionIds: readonly number[]) => void;
}
