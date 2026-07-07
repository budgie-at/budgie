import type { ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface UpdateTransactionSharedActionsParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionAccountId?: number | null;
    readonly transactionId: number;
    readonly transactionType: ConvertToTransferModalParams['transactionType'];
}
