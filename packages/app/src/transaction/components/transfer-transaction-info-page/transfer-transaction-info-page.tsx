import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const TransferTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openConsolidationSource] = useConsolidationSourceModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const handleRevert = useRevertConsolidation(transactionId, () => {
        router.back();
    });
    const handleDelete = () => deleteTransaction(transactionId, { isConsolidated });
    const handleConsolidationPress = () => {
        void openConsolidationSource({ transactionId });
    };
    const consolidationProps = isConsolidated ? { onOpenConsolidationSources: handleConsolidationPress } : {};
    const editHref = `/transactions/${transactionId}/transfer/edit` as const;

    return (
        <TransactionInfoPage
            transaction={transaction}
            editHref={editHref}
            onDelete={handleDelete}
            onRevert={handleRevert}
            {...consolidationProps}
        />
    );
};
