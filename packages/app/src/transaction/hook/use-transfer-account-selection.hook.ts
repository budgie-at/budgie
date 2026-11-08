import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { TRANSFER_ACCOUNT_FIELDS } from '../constant/transfer-account-fields.constant';

import { useTransferAccounts } from './use-transfer-accounts.hook';

import type { AnchoredMorphOriginInterface } from '../../@generic/interface/anchored-morph-origin.interface';

export const useTransferAccountSelection = () => {
    const { setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const accounts = useTransferAccounts();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const { fromAccountId, toAccountId } = accounts;

    const handleAccountPress = (
        field: (typeof TRANSFER_ACCOUNT_FIELDS)[number],
        initialAccountId: number | null,
        excludeAccountId: number | null,
        origin: AnchoredMorphOriginInterface
    ) => {
        setIsPickerOpen(true);
        openAccountSelector(
            { initialAccountId, excludeAccountId, excludeAccountTypes: [AccountTypeEnum.DEBT], onlyActive: false, origin },
            selectedAccountId => {
                setIsPickerOpen(false);

                if (isDefined(selectedAccountId)) {
                    setValue(field, selectedAccountId, { shouldDirty: true });
                }
            }
        );
    };

    const handleSwap = () => {
        setValue('fromAccountId', toAccountId, { shouldDirty: true });
        setValue('toAccountId', fromAccountId, { shouldDirty: true });
    };

    const handleFromPress = (origin: AnchoredMorphOriginInterface) =>
        void handleAccountPress('fromAccountId', fromAccountId, toAccountId, origin);
    const handleToPress = (origin: AnchoredMorphOriginInterface) =>
        void handleAccountPress('toAccountId', toAccountId, fromAccountId, origin);

    return {
        ...accounts,
        handleFromPress,
        handleToPress,
        handleSwap,
        canSwap: isDefined(fromAccountId) && isDefined(toAccountId),
        isSwapShown: !isPickerOpen && (isDefined(fromAccountId) || isDefined(toAccountId))
    };
};
