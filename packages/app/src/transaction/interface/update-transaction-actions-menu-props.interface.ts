import type { TransactionActionsMenuPropsInterface } from './transaction-actions-menu-props.interface';

export interface UpdateTransactionActionsMenuPropsInterface extends Pick<
    TransactionActionsMenuPropsInterface,
    'onDelete' | 'isConsolidated'
> {
    readonly onRevert: () => void;
    readonly onConvertToRefund: () => void;
    readonly onConvertToTransfer: () => void;
}
