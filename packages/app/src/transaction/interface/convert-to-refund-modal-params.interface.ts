import type { TransactionTypeEnum } from '@budgie/contracts';

export interface ConvertToRefundModalParamsInterface {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}
