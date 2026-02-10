import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface FrequentPatternQueryInterface {
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}
