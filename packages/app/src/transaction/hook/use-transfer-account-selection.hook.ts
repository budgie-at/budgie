import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { TRANSFER_ACCOUNT_FIELDS } from '../constant/transfer-account-fields.constant';

import { useTransferAccounts } from './use-transfer-accounts.hook';

export const useTransferAccountSelection = () => {
    const { setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const accounts = useTransferAccounts();
    const { fromAccountId, toAccountId } = accounts;

    const handleAccountPress = (
        field: (typeof TRANSFER_ACCOUNT_FIELDS)[number],
        initialAccountId: number | null,
        excludeAccountId: number | null
    ) => {
        openAccountSelector(
            { initialAccountId, excludeAccountId, excludeAccountTypes: [AccountTypeEnum.DEBT], onlyActive: false },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue(field, selectedAccountId);
                }
            }
        );
    };

    const handleSwap = () => {
        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', fromAccountId);
    };

    const handleFromPress = () => void handleAccountPress('fromAccountId', fromAccountId, toAccountId);
    const handleToPress = () => void handleAccountPress('toAccountId', toAccountId, fromAccountId);

    return {
        ...accounts,
        handleFromPress,
        handleToPress,
        handleSwap,
        canSwap: isDefined(fromAccountId) && isDefined(toAccountId),
        hasAnyAccount: isDefined(fromAccountId) || isDefined(toAccountId)
    };
};
