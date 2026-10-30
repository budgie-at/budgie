import type { TransactionsDayNetAmountInterface } from './transactions-day-net-amount.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface TransactionsByDaySectionInterface {
    readonly transactions: TransactionWithRelationsEntityInterface[];
    readonly title: string;
    readonly netAmount: TransactionsDayNetAmountInterface | null;
}
