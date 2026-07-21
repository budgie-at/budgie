import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListRevertMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();
    const revertConsolidation = useRevertConsolidation(transaction.id);

    const isConsolidated = isDefined(transaction.consolidationType);

    if (!isConsolidated) {
        return null;
    }

    const handlePress = () => {
        closeMenu(revertConsolidation);
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Undo2}
            label={t`Revert`}
            onPress={handlePress}
            variant="destructive"
            testID={TransactionListContextMenuSelector.RevertButton}
        />
    );
};
