import type { TransactionEntityInterface } from '@budgie/contracts';

export interface ImportedUpsertResultInterface {
    readonly transactions: TransactionEntityInterface[];
    readonly refilledTransactions: TransactionEntityInterface[];
}
