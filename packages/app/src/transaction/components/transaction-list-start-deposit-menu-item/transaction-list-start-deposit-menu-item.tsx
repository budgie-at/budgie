import { UserIconNameEnum, isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListStartDepositMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const closeMenu = useTransactionActionsMenu();

    const isVisible =
        !isDefined(transaction.consolidationType) &&
        !isDefined(transaction.consolidationParentTransactionId) &&
        isExpenseTransaction(transaction) &&
        getTransactionCategoryEntries(transaction.entries).length === 1;

    if (!isVisible) {
        return null;
    }

    const handleStartDeposit = () => {
        closeMenu(() => {
            router.push({ pathname: '/transactions/[id]/start-deposit', params: { id: String(transaction.id) } });
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Landmark}
            label={t`Start Deposit`}
            onPress={handleStartDeposit}
            testID={TransactionListContextMenuSelector.StartDepositButton}
        />
    );
};
