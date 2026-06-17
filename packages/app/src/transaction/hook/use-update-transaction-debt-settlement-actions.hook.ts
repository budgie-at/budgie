import { useLingui } from '@lingui/react/macro';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';

import type { UpdateTransactionDebtSettlementActionsParamsInterface } from '../interface/update-transaction-debt-settlement-actions-params.interface';

export const useUpdateTransactionDebtSettlementActions = ({
    form,
    transaction,
    transactionId,
    transactionAccountId
}: UpdateTransactionDebtSettlementActionsParamsInterface) => {
    const { t } = useLingui();

    return useDebtSettlementTransactionActions({
        form,
        transaction,
        transactionId,
        transactionAccountId,
        emptyStateDescription: t`Create a debt account first.`,
        attachErrorMessage: t`Could not attach debt`,
        detachErrorMessage: t`Could not detach debt`
    });
};
