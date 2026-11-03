import { UserIconNameEnum, isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListStartDepositMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();

    const isVisible =
        !isDefined(transaction.consolidationType) &&
        !isDefined(transaction.consolidationParentTransactionId) &&
        isExpenseTransaction(transaction) &&
        getTransactionCategoryEntries(transaction.entries).length === 1;

    if (!isVisible) {
        return null;
    }

    const handleStartDeposit = () => {
        router.push({ pathname: '/transactions/[id]/start-deposit', params: { id: String(transaction.id) } });
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Landmark}
            label={t`Start Deposit`}
            onPress={handleStartDeposit}
            testID={TransactionListContextMenuSelector.StartDepositButton}
        />
    );
};
