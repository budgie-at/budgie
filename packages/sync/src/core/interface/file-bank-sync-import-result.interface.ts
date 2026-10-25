export interface FileBankSyncImportResultInterface {
    readonly accountCount: number;
    readonly parsedTransactionCount: number;
    readonly newTransactionCount: number;
    readonly existingTransactionCount: number;
}
