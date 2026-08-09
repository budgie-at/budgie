import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { transactionTransferService } from '../../../transaction/service/transaction-transfer.service';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
import { accountService } from '../../service/account.service';

interface Props {
    readonly accountId: number;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const CloseDepositAccount = ({ accountId, balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();
    const formatDigits = useDisplayFormatDigits();
    const [isLoading, setIsLoading] = useState(false);

    const confirmDepositClose = async (destinationAccountId: number): Promise<boolean> => {
        const destinationAccount = await accountService.findByIdOrFail(destinationAccountId);
        const destinationAccountTitle = destinationAccount.title;
        const formattedBalance = formatDigits(balance, instrumentSymbol);

        return confirmAlert({
            title: t`Close Deposit?`,
            message: t`${formattedBalance} will be transferred to ${destinationAccountTitle} and this deposit will be archived. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Close Deposit`,
            cancelText: t`Cancel`,
            isDestructive: true
        });
    };

    const performDepositClose = async (destinationAccountId: number): Promise<void> => {
        try {
            await transactionTransferService.closeDepositTo(accountId, destinationAccountId);
            dismissAllOrReplace('/');
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Could not close deposit`,
                text2: getErrorMessage(error)
            });
        }
    };

    const handleClose = async () => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        const destinationAccountId = await openAccountSelector({ excludeAccountId: accountId });

        if (!isDefined(destinationAccountId)) {
            setIsLoading(false);

            return;
        }

        const confirmed = await confirmDepositClose(destinationAccountId);

        if (!confirmed) {
            setIsLoading(false);

            return;
        }

        await performDepositClose(destinationAccountId);
        setIsLoading(false);
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            leftIcon={UserIconNameEnum.LogOut}
            content={t`Close Deposit`}
            isLoading={isLoading}
            onPress={handleClose}
            testID={AccountDetailsSelector.CloseDepositButton}
        />
    );
};
