import { TransactionTypeEnum } from '@budgie/contracts';

import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { SimpleTransactionInfoPage } from '../simple-transaction-info-page/simple-transaction-info-page';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const ExpenseTransactionInfoPage = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const transactionId = transaction.id;
    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    return (
        <SimpleTransactionInfoPage
            transaction={transaction}
            transactionType={TransactionTypeEnum.EXPENSE}
            onOpenRefundSources={handleOpenRefundSources}
        />
    );
};
