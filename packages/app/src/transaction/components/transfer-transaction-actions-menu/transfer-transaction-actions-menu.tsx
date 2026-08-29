import { isDefined } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete'> {
    readonly transaction: Pick<TransactionWithRelationsEntityInterface, 'id' | 'consolidationType'>;
    readonly onFeePress: EmptyFn;
}

export const TransferTransactionActionsMenu = ({ transaction, onDelete, onFeePress }: Props) => {
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transaction.id, () => void dismissAllOrReplace('/'));

    return (
        <UpdateTransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} onRevert={handleRevert} onFeePress={onFeePress} />
    );
};
