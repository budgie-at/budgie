import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListRevertMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();
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
            label={t`Separate Transactions`}
            onPress={handlePress}
            variant="destructive"
            testID={TransactionListContextMenuSelector.RevertButton}
        />
    );
};
