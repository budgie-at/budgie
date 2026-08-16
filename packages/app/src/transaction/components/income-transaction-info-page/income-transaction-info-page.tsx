import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useOpenRefundConvert } from '../../hook/use-open-refund-convert.hook';
import { useUpdateTransactionSharedActions } from '../../hook/use-update-transaction-shared-actions.hook';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const IncomeTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const deleteTransaction = useDeleteTransaction();
    const router = useRouter();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const editHref = { pathname: '/transactions/[id]/income/edit' as const, params: { id: String(transactionId) } };
    const canConvertToRefund = !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleOpenRefundConvert = useOpenRefundConvert(transactionId);
    const {
        debtSettlementAccountTitle,
        handleDetachDebtSettlement,
        handleOpenConvert,
        handleOpenDebtSettlement,
        handleRevert,
        hasDebtSettlement
    } = useUpdateTransactionSharedActions({
        transaction,
        transactionAccountId: transaction.toAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.INCOME
    });
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(TransactionTypeEnum.INCOME, transactionId));
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const transferConvertProps =
        getTransactionCategoryEntries(transaction.entries).length === 1 ? { onConvertToTransfer: handleOpenConvert } : {};
    const debtSettlementProps = hasDebtSettlement
        ? { onDetachDebtSettlement: handleDetachDebtSettlement }
        : {
              onAttachDebtSettlement: handleOpenDebtSettlement,
              ...(isDefined(debtSettlementAccountTitle) && { attachDebtSettlementLabel: debtSettlementAccountTitle })
          };
    const actionsMenu = (
        <UpdateTransactionActionsMenu
            onDelete={handleDelete}
            isConsolidated={isConsolidated}
            onRevert={handleRevert}
            onFeePress={handleOpenFee}
            {...refundConvertProps}
            {...transferConvertProps}
            {...debtSettlementProps}
        />
    );

    return <TransactionInfoPage transaction={transaction} editHref={editHref} actionsMenu={actionsMenu} />;
};
