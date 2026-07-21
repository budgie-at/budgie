import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListEditMenuItem = () => {
    const { t } = useLingui();
    const router = useRouter();
    const { transaction, closeMenu } = useTransactionListContextMenu();

    const handlePress = () => {
        closeMenu(() => void router.push(getTransactionHref(transaction)));
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
