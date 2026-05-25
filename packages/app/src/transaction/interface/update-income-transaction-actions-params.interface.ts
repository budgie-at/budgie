import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateIncomeTransactionActionsParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly toAccountId?: number | null;
}
