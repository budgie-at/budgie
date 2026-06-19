import { TransactionTypeEnum } from '@budgie/contracts';

import { useConsolidationSourceModal } from '../context/consolidation-source-modal.context';

import { useUpdateTransactionSharedActions } from './use-update-transaction-shared-actions.hook';

import type { UpdateExpenseTransactionActionsParamsInterface } from '../interface/update-expense-transaction-actions-params.interface';

export const useUpdateExpenseTransactionActions = ({
    form,
    transaction,
    transactionId,
    fromAccountId
}: UpdateExpenseTransactionActionsParamsInterface) => {
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const transactionActions = useUpdateTransactionSharedActions({
        form,
        transaction,
        transactionAccountId: fromAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.EXPENSE
    });

    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    return {
        handleOpenRefundSources,
        ...transactionActions
    };
};
