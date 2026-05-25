import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateExpenseTransactionActionsParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly fromAccountId?: number | null;
}
