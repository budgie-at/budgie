import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useSimpleTransactionActionsMenu } from '../../hook/use-simple-transaction-actions-menu.hook';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoActionsGroup } from '../transaction-info-actions-group/transaction-info-actions-group';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly onOpenRefundSources?: () => void;
}

export const SimpleTransactionInfoPage = ({ transaction, transactionType, onOpenRefundSources }: Props) => {
    const deleteTransaction = useDeleteTransaction();
    const { run } = useSingleFlight();
    const router = useRouter();
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const transactionAccountId = isExpense ? transaction.fromAccountId : transaction.toAccountId;
    const categoryEntryCount = getTransactionCategoryEntries(transaction.entries).length;
    const handleDelete = () => run(deleteTransaction(transactionId, { isConsolidated }));
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(transactionType, transactionId));
    const { actionsMenuProps } = useSimpleTransactionActionsMenu({
        transaction,
        transactionAccountId,
        transactionType,
        categoryEntryCount,
        onDelete: handleDelete,
        onFeePress: handleOpenFee
    });

    return (
        <TransactionInfoPage
            transaction={transaction}
            onDelete={handleDelete}
            editHref={getTransactionEditHref(transaction)}
            actions={
                <TransactionInfoActionsGroup
                    transaction={transaction}
                    items={actionsMenuProps.items}
                    onRevert={actionsMenuProps.onRevert}
                />
            }
            onOpenRefundSources={onOpenRefundSources}
        />
    );
};
