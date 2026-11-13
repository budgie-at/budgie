import { AccountTypeEnum } from '@budgie/contracts';
import { AccountService, TransactionTransferService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

export const useDepositCloseAction = (accountId: number, balance: number, instrumentSymbol: string) => {
    const { t } = useLingui();
    const openAccountSelector = useOpenModal('/account-selector');
    const formatDigits = useDisplayFormatDigits();
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

        const accountService = yield* AccountService;
        const destinationAccount = yield* accountService.findByIdOrFail(destinationAccountId);
        const formattedBalance = formatDigits(balance, instrumentSymbol);
        const destinationAccountTitle = destinationAccount.title;
        const confirmed = yield* confirmAlert({
            title: t`Close Deposit?`,
            message: t`${formattedBalance} will be transferred to ${destinationAccountTitle} and this deposit will be archived. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Close Deposit`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        const transactionTransferService = yield* TransactionTransferService;

        yield* transactionTransferService.closeDepositTo(accountId, destinationAccountId, balance);
        yield* Effect.sync(() => void dismissAllOrReplace('/'));
    });

    const handleCloseDeposit = () => {
        if (isLoading) {
            return;
        }

        void run(closeDeposit.pipe(toastOnFailure(t`Could not close deposit`)));
    };

    return { handleCloseDeposit, isLoading };
};
