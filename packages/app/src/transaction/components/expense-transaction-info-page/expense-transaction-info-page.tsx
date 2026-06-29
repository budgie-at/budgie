import { isDefined } from '@rnw-community/shared';

import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useUpdateExpenseTransactionActions } from '../../hook/use-update-expense-transaction-actions.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const ExpenseTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const { handleOpenConvert, handleOpenRefundSources, handleRevert } = useUpdateExpenseTransactionActions({
        transaction,
        transactionId,
        fromAccountId: transaction.fromAccountId
    });
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const editHref = `/transactions/${transactionId}/expense/edit` as const;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            onDelete={handleDelete}
            onRevert={handleRevert}
            onOpenRefundSources={handleOpenRefundSources}
            {...transferConvertProps}
        />
    );
};
