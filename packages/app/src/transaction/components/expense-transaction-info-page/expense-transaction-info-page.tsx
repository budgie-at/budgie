import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useUpdateTransactionSharedActions } from '../../hook/use-update-transaction-shared-actions.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const ExpenseTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const router = useRouter();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const {
        debtSettlementAccountTitle,
        handleDetachDebtSettlement,
        handleOpenConvert,
        handleOpenDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateTransactionSharedActions({
        transaction,
        transactionAccountId: transaction.fromAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.EXPENSE
    });
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });
    const debtSettlementProps = hasDebtSettlement
        ? { onDetachDebtSettlement: handleDetachDebtSettlement }
        : {
              onAttachDebtSettlement: handleOpenDebtSettlement,
              ...(isDefined(debtSettlementAccountTitle) && { attachDebtSettlementLabel: debtSettlementAccountTitle })
          };

    const editHref = { pathname: '/transactions/[id]/expense/edit' as const, params: { id: String(transactionId) } };
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(TransactionTypeEnum.EXPENSE, transactionId));
    const transferConvertProps = categoryEntries.length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const actionsMenu = (
        <UpdateTransactionActionsMenu
            onDelete={handleDelete}
            isConsolidated={isConsolidated}
            onRevert={handleRevert}
            onFeePress={handleOpenFee}
            {...debtSettlementProps}
            {...transferConvertProps}
        />
    );

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            actionsMenu={actionsMenu}
            onOpenRefundSources={handleOpenRefundSources}
        />
    );
};
