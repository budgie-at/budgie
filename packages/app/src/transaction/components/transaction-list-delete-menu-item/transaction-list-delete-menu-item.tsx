import { UserIconNameEnum, logAndContinue } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListDeleteMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const deleteTransaction = useDeleteTransaction();

    const isConsolidated = isDefined(transaction.consolidationType);

    if (isConsolidated) {
        return null;
    }

    const handlePress = () => {
        appRuntime.runFork(logAndContinue(deleteTransaction(transaction.id, { isConsolidated: false })));
    };

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Trash2}
            label={t`Delete Transaction`}
            onPress={handlePress}
            variant="destructive"
            testID={TransactionListContextMenuSelector.DeleteButton}
        />
    );
};
