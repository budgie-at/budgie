import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListEditMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const router = useRouter();

    const editHref = getTransactionEditHref(transaction);

    if (!isDefined(editHref)) {
        return null;
    }

    const handlePress = () => {
        void router.push(editHref);
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Pencil}
            label={t`Edit Transaction`}
            onPress={handlePress}
            testID={TransactionListContextMenuSelector.EditButton}
        />
    );
};
