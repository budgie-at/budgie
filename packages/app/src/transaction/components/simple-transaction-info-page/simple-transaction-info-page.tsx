import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useSimpleTransactionActionsMenu } from '../../hook/use-simple-transaction-actions-menu.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly onOpenRefundSources?: () => void;
}

export const SimpleTransactionInfoPage = ({ transaction, transactionType, onOpenRefundSources }: Props) => {
    const deleteTransaction = useDeleteTransaction();
    const router = useRouter();
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const transactionAccountId = isExpense ? transaction.fromAccountId : transaction.toAccountId;
    const categoryEntryCount = getTransactionCategoryEntries(transaction.entries).length;
    const pathname = isExpense ? '/transactions/[id]/expense/edit' : '/transactions/[id]/income/edit';
    const editHref = { pathname, params: { id: String(transactionId) } };
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(transactionType, transactionId));
    const { actionsMenuProps } = useSimpleTransactionActionsMenu({
        transaction,
        transactionAccountId,
        transactionType,
        categoryEntryCount,
        onDelete: handleDelete,
        onFeePress: handleOpenFee
    });
    const actionsMenu = <UpdateTransactionActionsMenu {...actionsMenuProps} />;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            actionsMenu={actionsMenu}
            onOpenRefundSources={onOpenRefundSources}
        />
    );
};
