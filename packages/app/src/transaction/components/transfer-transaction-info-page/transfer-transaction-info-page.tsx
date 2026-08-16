import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const TransferTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openConsolidationSource] = useConsolidationSourceModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const editHref = { pathname: '/transactions/[id]/transfer/edit' as const, params: { id: String(transactionId) } };
    const handleRevert = useRevertConsolidation(transactionId, () => {
        router.back();
    });
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(editHref.pathname, transactionId));
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleConsolidationPress = () => {
        void openConsolidationSource({ transactionId });
    };
    const consolidationProps = isConsolidated ? { onOpenConsolidationSources: handleConsolidationPress } : {};
    const actionsMenu = (
        <UpdateTransactionActionsMenu
            onDelete={handleDelete}
            isConsolidated={isConsolidated}
            onRevert={handleRevert}
            onFeePress={handleOpenFee}
        />
    );

    return <TransactionInfoPage transaction={transaction} editHref={editHref} actionsMenu={actionsMenu} {...consolidationProps} />;
};
