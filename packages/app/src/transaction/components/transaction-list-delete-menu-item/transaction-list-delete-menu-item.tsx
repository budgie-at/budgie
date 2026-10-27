import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
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
            appRuntime.runFork(logAndContinue(deleteTransaction(transaction.id, { isConsolidated: false })));
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
