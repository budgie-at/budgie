import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionsByDaySectionInterface {
    readonly transactions: TransactionWithRelationsEntityInterface[];
    readonly title: string;
}
