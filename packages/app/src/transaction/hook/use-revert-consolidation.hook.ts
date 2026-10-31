import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { EmptyFn } from '@rnw-community/shared';

export const useRevertConsolidation = (transactionId: number, onSuccess?: EmptyFn, isRefund = false) => {
    const { t } = useLingui();

    const { run } = useSingleFlight();

    const revertConsolidation = () => {
        void run(
            Effect.gen(function* () {
                const isReverted = yield* runConfirmedTransactionAction(
                    {
                        title: isRefund ? t`Undo refund?` : t`Separate transactions?`,
                        message: isRefund
                            ? t`The refund and the purchase become separate entries again.`
                            : t`The merged transactions become separate entries again.`,
                        confirmText: isRefund ? t`Undo Refund` : t`Separate`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    },
                    t`Could not separate transactions.`,
                    transactionService => transactionService.unconsolidateById(transactionId)
                );

                if (isReverted) {
                    onSuccess?.();
                }
            })
        );
    };

    return revertConsolidation;
};
