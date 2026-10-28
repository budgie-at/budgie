import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { EmptyFn } from '@rnw-community/shared';

export const useRevertConsolidation = (transactionId: number, onSuccess?: EmptyFn) => {
    const { t } = useLingui();

    const { run } = useSingleFlight();

    const revertConsolidation = () => {
        void run(
            Effect.gen(function* () {
                const isReverted = yield* runConfirmedTransactionAction(
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
            })
        );
    };

    return revertConsolidation;
};
