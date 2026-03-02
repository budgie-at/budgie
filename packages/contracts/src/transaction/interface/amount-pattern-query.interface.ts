import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface AmountPatternQueryInterface {
    readonly type: TransactionTypeEnum;
    readonly amountMin: number;
    readonly amountMax: number;
    readonly accountId?: number;
    readonly categoryId?: number;
    readonly limit?: number;
}
