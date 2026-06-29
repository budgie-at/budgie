import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { ZodType } from 'zod';

export interface UpdateSimpleTransactionParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly schema: ZodType<TransactionCreateInputInterface, TransactionCreateInputInterface>;
}
