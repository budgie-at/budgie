import { TransactionTypeEnum } from '@budgie/contracts';

export interface FindSimilarPatternsParamsInterface {
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amountMin?: number;
    readonly amountMax?: number;
    readonly limit?: number;
}
