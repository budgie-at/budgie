import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListDeleteMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const deleteTransaction = useDeleteTransaction();

    const isConsolidated = isDefined(transaction.consolidationType);

    if (isConsolidated) {
        return null;
    }

    const handlePress = () => {
        closeMenu(() => {
            deleteTransaction(transaction.id, { isConsolidated: false }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Trash2}
            label={t`Delete Transaction`}
            onPress={handlePress}
            variant="destructive"
            testID={TransactionListContextMenuSelector.DeleteButton}
        />
    );
};
