import { useLingui } from '@lingui/react/macro';

import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { EmptyFn } from '@rnw-community/shared';

export const useRevertConsolidation = (transactionId: number, onSuccess?: EmptyFn) => {
    const { t } = useLingui();

    const revertConsolidationAsync = async () => {
        const isReverted = await runConfirmedTransactionAction(
            {
                title: t`Revert consolidation?`,
                message: t`This will restore the original transactions and remove the consolidated transaction.`,
                confirmText: t`Revert`,
                cancelText: t`Cancel`,
                isDestructive: true
            },
            t`Could not revert consolidation.`,
            transactionService => transactionService.unconsolidateById(transactionId)
        );

        if (isReverted) {
            onSuccess?.();
        }
    };

    const revertConsolidation = () => {
        void revertConsolidationAsync();
    };

    return revertConsolidation;
};
