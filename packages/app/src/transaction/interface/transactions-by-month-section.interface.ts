import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionsByMonthSection {
    transactions: TransactionWithRelationsEntityInterface[];
    date: string;
}
