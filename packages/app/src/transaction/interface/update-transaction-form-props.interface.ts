import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateTransactionFormPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}
