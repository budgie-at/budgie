import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';

export const useDepositCloseAction = (accountId: number) => {
    const { t } = useLingui();
    const openAccountSelector = useOpenModal('/account-selector');
    const openDepositClose = useOpenModal('/deposit-close');
    const { isLoading, run } = useSingleFlight();

    const closeDeposit = Effect.gen(function* () {
        const destinationAccountId = yield* Effect.callback<number | null>(resume => {
            openAccountSelector({ excludeAccountId: accountId, excludeAccountTypes: [AccountTypeEnum.DEBT] }, selectedAccountId => {
                resume(Effect.succeed(selectedAccountId));
            });
        });

        if (!isDefined(destinationAccountId)) {
            return;
        }

        yield* Effect.sync(() => void openDepositClose({ depositAccountId: accountId, destinationAccountId }, emptyFn));
    });

    const handleCloseDeposit = () => {
        if (isLoading) {
            return;
        }

        void run(closeDeposit.pipe(toastOnFailure(t`Could not close deposit`)));
    };

    return { handleCloseDeposit, isLoading };
};
