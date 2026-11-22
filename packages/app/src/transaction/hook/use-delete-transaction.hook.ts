import { Db } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { BROKERAGE_FUNDING_TITLE } from '../../brokerage/constant/brokerage-funding-title.constant';
import { BrokerageService } from '../../brokerage/service/brokerage.service';
import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { DeleteTransactionOptionsInterface } from '../interface/delete-transaction-options.interface';

export const useDeleteTransaction = () => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();

    const deleteTransaction = (transactionId: number, options?: DeleteTransactionOptionsInterface) => {
        const isConsolidated = options?.isConsolidated === true;
        const title = isConsolidated ? t`Separate transactions?` : t`Are you sure?`;
        const message = isConsolidated ? t`The merged transactions become separate entries again.` : t`This action cannot be undone.`;
        const confirmText = isConsolidated ? t`Separate` : t`Delete`;
        const errorText = isConsolidated ? t`Could not separate transactions.` : t`Could not delete transaction.`;

        return runConfirmedTransactionAction(
            { title, message, confirmText, cancelText: t`Cancel`, isDestructive: true },
            errorText,
            transactionService =>
                Effect.sync(() => void hapticImpact(ImpactFeedbackStyle.Heavy)).pipe(
                    Effect.andThen(
                        Db.transaction(
                            transactionService.deleteById(transactionId).pipe(
                                Effect.andThen(BrokerageService),
                                Effect.flatMap(brokerageService => brokerageService.reconcileFunding(t(BROKERAGE_FUNDING_TITLE)))
                            )
                        )
                    )
                )
        );
    };

    return deleteTransaction;
};
