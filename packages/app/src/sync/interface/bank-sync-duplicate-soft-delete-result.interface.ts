export interface BankSyncDuplicateSoftDeleteResultInterface {
    readonly repairedEntryCount: number;
    readonly updatedTransactionIds: readonly number[];
}
