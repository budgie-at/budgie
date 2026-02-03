import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionPatternQueryInterface {
    readonly weekday: number;
    readonly timeWindowStartMinutes: number;
    readonly timeWindowEndMinutes: number;
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly categoryId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}
