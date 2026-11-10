import type { ModalParams } from '../../@generic/type/modal-params.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

export interface SimpleTransactionActionsMenuParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionAccountId?: number | null;
    readonly transactionType: ModalParams<'/convert-to-transfer'>['transactionType'];
    readonly categoryEntryCount: number;
    readonly onDelete: () => unknown;
    readonly onFeePress: EmptyFn;
}
