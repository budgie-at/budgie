import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';

import { useUpdateTransactionSharedActions } from './use-update-transaction-shared-actions.hook';

import type { UpdateIncomeTransactionActionsParamsInterface } from '../interface/update-income-transaction-actions-params.interface';

export const useUpdateIncomeTransactionActions = ({
    form,
    transaction,
    transactionId,
    toAccountId
}: UpdateIncomeTransactionActionsParamsInterface) => {
    const [openConvertToRefund] = useConvertToRefundModal();
    const transactionActions = useUpdateTransactionSharedActions({
        form,
        transaction,
        transactionAccountId: toAccountId,
        transactionId,
        transactionType: TransactionTypeEnum.INCOME
    });

    const handleOpenRefundConvert = () =>
        void openConvertToRefund({
            refundIncomeTransactionId: transactionId
        }).then(canonicalId => {
            if (isDefined(canonicalId)) {
                const expenseRoute = `/transactions/${canonicalId}/expense` as const;

                router.replace(expenseRoute);
            }

            return null;
        });

    return {
        handleOpenRefundConvert,
        ...transactionActions
    };
};
