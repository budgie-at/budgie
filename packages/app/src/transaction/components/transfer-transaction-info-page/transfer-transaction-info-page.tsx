import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useTransferTransactionActions } from '../../hook/use-transfer-transaction-actions.hook';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoActionsGroup } from '../transaction-info-actions-group/transaction-info-actions-group';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

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
    const actions = useTransferTransactionActions(transaction, handleOpenFee);

    return (
        <TransactionInfoPage
            transaction={transaction}
            onDelete={handleDelete}
            editHref={getTransactionEditHref(transaction)}
            actions={<TransactionInfoActionsGroup transaction={transaction} items={actions.items} />}
            {...consolidationProps}
        />
    );
};
