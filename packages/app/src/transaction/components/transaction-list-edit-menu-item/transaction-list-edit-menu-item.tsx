import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListEditMenuItem = () => {
    const { t } = useLingui();
    const router = useRouter();
    const { transaction, closeMenu } = useTransactionListContextMenu();

    const handlePress = () => {
        closeMenu(() => void router.push(getTransactionEditHref(transaction)));
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Pencil}
            label={t`Edit Transaction`}
            onPress={handlePress}
            testID={TransactionListContextMenuSelector.EditButton}
        />
    );
};
