import type { TransactionCreateInputSchema, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateSimpleTransactionParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly schema: typeof TransactionCreateInputSchema;
}
