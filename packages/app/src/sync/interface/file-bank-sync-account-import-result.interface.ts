import type { TransactionEntityInterface } from '@budgie/contracts';

export interface FileBankSyncAccountImportResultInterface {
    readonly parsedTransactionCount: number;
    readonly newTransactions: TransactionEntityInterface[];
}
