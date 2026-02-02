import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionPatternQueryInterface {
    weekday: number;
    timeWindowStartMinutes: number;
    timeWindowEndMinutes: number;
    type: TransactionTypeEnum;
    accountId?: number;
    categoryId?: number;
    amountMin?: number;
    amountMax?: number;
    limit?: number;
}
