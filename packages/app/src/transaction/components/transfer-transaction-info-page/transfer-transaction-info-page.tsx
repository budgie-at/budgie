import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';
import { TransferTransactionActionsMenu } from '../transfer-transaction-actions-menu/transfer-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const TransferTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const { run } = useSingleFlight();
    const [openConsolidationSource] = useConsolidationSourceModal();
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(TransactionTypeEnum.TRANSFER, transactionId));
    const handleDelete = () => run(deleteTransaction(transactionId, { isConsolidated }));
    const handleConsolidationPress = () => {
        openConsolidationSource({ transactionId });
    };
    const consolidationProps = isConsolidated ? { onOpenConsolidationSources: handleConsolidationPress } : {};
    const actionsMenu = <TransferTransactionActionsMenu transaction={transaction} onFeePress={handleOpenFee} />;

    return (
        <TransactionInfoPage
            transaction={transaction}
            onDelete={handleDelete}
            editHref={getTransactionEditHref(transaction)}
            actionsMenu={actionsMenu}
            {...consolidationProps}
        />
    );
};
