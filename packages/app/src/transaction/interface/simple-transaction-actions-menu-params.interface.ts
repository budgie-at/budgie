import type { ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

export interface SimpleTransactionActionsMenuParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionAccountId?: number | null;
    readonly transactionType: ConvertToTransferModalParams['transactionType'];
    readonly categoryEntryCount: number;
    readonly onDelete: () => Promise<void> | void;
    readonly onFeePress: EmptyFn;
}
