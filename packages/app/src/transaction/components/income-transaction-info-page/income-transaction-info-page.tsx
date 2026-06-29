import { isDefined } from '@rnw-community/shared';

import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useUpdateIncomeTransactionActions } from '../../hook/use-update-income-transaction-actions.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const IncomeTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const { handleOpenConvert, handleOpenRefundConvert, handleRevert } = useUpdateIncomeTransactionActions({
        transaction,
        transactionId,
        toAccountId: transaction.toAccountId
    });
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const canConvertToRefund = !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const editHref = `/transactions/${transactionId}/income/edit` as const;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            onDelete={handleDelete}
            onRevert={handleRevert}
            {...refundConvertProps}
            {...transferConvertProps}
        />
    );
};
