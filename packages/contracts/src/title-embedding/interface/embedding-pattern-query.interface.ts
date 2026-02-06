import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface EmbeddingPatternQueryInterface {
    readonly titles: string[];
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}
