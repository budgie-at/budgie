import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListEditMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const closeMenu = useTransactionActionsMenu();

    const editHref = getTransactionEditHref(transaction);

    if (!isDefined(editHref)) {
        return null;
    }

    const handlePress = () => {
        closeMenu(() => void router.push(editHref));
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
