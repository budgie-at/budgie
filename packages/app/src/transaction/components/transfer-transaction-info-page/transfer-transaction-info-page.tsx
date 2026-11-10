import { TransactionTypeEnum } from '@budgie/contracts';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useTransferTransactionActions } from '../../hook/use-transfer-transaction-actions.hook';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
import { getTransactionFeeEditHref } from '../../utils/get-transaction-fee-edit-href.util';
import { TransactionInfoPageContent } from '../transaction-info-page-content/transaction-info-page-content';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const TransferTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const { run } = useSingleFlight();
    const openConsolidationSource = useOpenModal('/consolidation-source');
    const isConsolidated = isDefined(transaction.consolidationType);
    const transactionId = transaction.id;
    const handleOpenFee = () => void router.push(getTransactionFeeEditHref(TransactionTypeEnum.TRANSFER, transactionId));
    const handleDelete = () => run(deleteTransaction(transactionId, { isConsolidated }));
    const handleConsolidationPress = () => {
        openConsolidationSource({ transactionId });
    };
    const actions = useTransferTransactionActions(transaction, handleOpenFee);

    return (
        <TransactionInfoPage>
            <TransactionInfoPageContent
                transaction={transaction}
                onDelete={handleDelete}
                onFeePress={handleOpenFee}
                editHref={getTransactionEditHref(transaction)}
                actionItems={actions.items}
                {...(isConsolidated && { onOpenSources: handleConsolidationPress })}
            />
        </TransactionInfoPage>
    );
};
