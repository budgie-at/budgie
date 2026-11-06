import { InstallmentPlanService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { EmptyFn } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useRevertInstallmentPlan = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const revert = (accountId: number, onReverted: EmptyFn, shouldConfirm = true) =>
        void run(
            Effect.gen(function* () {
                if (shouldConfirm) {
                    const isConfirmed = yield* confirmAlert({
                        title: t`Undo pay in parts?`,
                        message: t`Its payments become regular expenses again and the plan disappears. This can't be undone.`,
                        confirmText: t`Undo`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (!isConfirmed) {
                        return;
                    }
                }

                yield* Effect.flatMap(InstallmentPlanService, installmentPlanService =>
                    installmentPlanService.revertExpense(accountId)
                ).pipe(toastOnFailure(t`Could not undo.`, t`Please try again`));
                yield* Effect.sync(() => {
                    showSuccessToast(t`Plan reverted`);
                    onReverted();
                });
            })
        );

    return { isLoading, revert };
};
