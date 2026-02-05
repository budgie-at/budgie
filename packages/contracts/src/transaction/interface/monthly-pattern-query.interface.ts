import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface MonthlyPatternQueryInterface {
    readonly dayOfMonth: number;
    readonly dayWindowSize: number;
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}
