import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { UseFormReturn } from 'react-hook-form';

export interface UpdateExpenseTransactionActionsParamsInterface {
    readonly form: Pick<UseFormReturn<TransactionCreateInputInterface>, 'control' | 'getValues' | 'setValue'>;
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly fromAccountId?: number | null;
}
