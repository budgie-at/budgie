import { useLingui } from '@lingui/react/macro';

import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { DeleteTransactionOptionsInterface } from '../interface/delete-transaction-options.interface';

export const useDeleteTransaction = () => {
    const { t } = useLingui();

    const deleteTransaction = (transactionId: number, options?: DeleteTransactionOptionsInterface) => {
        const isConsolidated = options?.isConsolidated === true;
        const title = isConsolidated ? t`Unconsolidate transaction?` : t`Are you sure?`;
        const message = isConsolidated
            ? t`Original imported transactions will be restored and the consolidated transaction will be removed.`
            : t`This action cannot be undone.`;
        const confirmText = isConsolidated ? t`Unconsolidate` : t`Delete`;
        const errorText = isConsolidated ? t`Could not unconsolidate transaction.` : t`Could not delete transaction.`;

        return runConfirmedTransactionAction(
            { title, message, confirmText, cancelText: t`Cancel`, isDestructive: true },
            errorText,
            transactionService => transactionService.deleteById(transactionId)
        );
    };

    return deleteTransaction;
};
