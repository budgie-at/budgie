import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface MonthlyPatternQueryInterface {
    readonly type: TransactionTypeEnum;
    readonly timezoneOffsetSeconds: number;
    readonly limit?: number;
}
