import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { transactionTransferService } from '../../../transaction/service/transaction-transfer.service';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
import { accountService } from '../../service/account.service';

export const useDepositCloseAction = (accountId: number, balance: number, instrumentSymbol: string) => {
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();
    const formatDigits = useDisplayFormatDigits();
    const [isLoading, setIsLoading] = useState(false);

    const confirmDepositClose = async (destinationAccountId: number): Promise<boolean> => {
        const destinationAccount = await accountService.findByIdOrFail(destinationAccountId);
        const formattedBalance = formatDigits(balance, instrumentSymbol);
        const destinationAccountTitle = destinationAccount.title;

        return confirmAlert({
            title: t`Close Deposit?`,
            message: t`${formattedBalance} will be transferred to ${destinationAccountTitle} and this deposit will be archived. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Close Deposit`,
            cancelText: t`Cancel`,
            isDestructive: true
        });
    };

    const handleCloseDeposit = async () => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            const destinationAccountId = await openAccountSelector({ excludeAccountId: accountId });

            if (!isDefined(destinationAccountId)) {
                return;
            }

            const confirmed = await confirmDepositClose(destinationAccountId);

            if (!confirmed) {
                return;
            }

            await transactionTransferService.closeDepositTo(accountId, destinationAccountId);
            dismissAllOrReplace('/');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Could not close deposit`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return { handleCloseDeposit, isLoading };
};
