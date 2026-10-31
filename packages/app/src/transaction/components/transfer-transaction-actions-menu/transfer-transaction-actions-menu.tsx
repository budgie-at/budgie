import { useTransferTransactionActions } from '../../hook/use-transfer-transaction-actions.hook';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete'> {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly onFeePress: EmptyFn;
}

export const TransferTransactionActionsMenu = ({ transaction, onDelete, onFeePress }: Props) => {
    const actionsMenuProps = useTransferTransactionActions(transaction, onFeePress);

    return <UpdateTransactionActionsMenu {...actionsMenuProps} onDelete={onDelete} />;
};
