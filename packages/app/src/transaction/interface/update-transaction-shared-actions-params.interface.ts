import type { ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';
import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { UseFormReturn } from 'react-hook-form';

export interface UpdateTransactionSharedActionsParamsInterface {
    readonly form: Pick<UseFormReturn<TransactionCreateInputInterface>, 'control' | 'getValues' | 'setValue'>;
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionAccountId?: number | null;
    readonly transactionId: number;
    readonly transactionType: ConvertToTransferModalParams['transactionType'];
}
