import { TransactionTypeEnum } from '@budgie/contracts';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { SimpleTransactionInfoPage } from '../simple-transaction-info-page/simple-transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const ExpenseTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const openConsolidationSourceModal = useOpenModal('/consolidation-source');
    const transactionId = transaction.id;
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    return (
        <SimpleTransactionInfoPage
            transaction={transaction}
            transactionType={TransactionTypeEnum.EXPENSE}
            onOpenSources={handleOpenRefundSources}
        />
    );
};
