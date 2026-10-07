import { UserIconNameEnum, isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionListContextMenu } from '../../context/transaction-list-context-menu.context';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

export const TransactionListStartDepositMenuItem = () => {
    const { t } = useLingui();
    const { transaction, closeMenu } = useTransactionListContextMenu();

    const isVisible =
        !isDefined(transaction.consolidationType) &&
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
            onPress={emptyFn}
            onPressIn={handleStartDeposit}
            testID={TransactionListContextMenuSelector.StartDepositButton}
        />
    );
};
