import type { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateSimpleTransactionParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly openFeeOnMount?: boolean;
}
