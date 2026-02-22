import { TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';

export interface FindMatchingTransactionsResultInterface {
    readonly transactions: TransactionWithEntriesMccCategoryEntityInterface[];
    readonly count: number;
}
