import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useMeasureInWindowPress } from '../../@generic/hook/use-measure-in-window-press.hook';
import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { TRANSFER_ACCOUNT_FIELDS } from '../constant/transfer-account-fields.constant';

import { useTransferAccounts } from './use-transfer-accounts.hook';

import type { WindowRectInterface } from '../../@generic/interface/window-rect.interface';

export const useTransferAccountSelection = () => {
    const { setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const accounts = useTransferAccounts();
    const { fromAccountId, toAccountId } = accounts;

    const handleAccountPress = (
        field: (typeof TRANSFER_ACCOUNT_FIELDS)[number],
        initialAccountId: number | null,
        excludeAccountId: number | null,
        originRect: WindowRectInterface
    ) => {
        openAccountSelector(
            { initialAccountId, excludeAccountId, excludeAccountTypes: [AccountTypeEnum.DEBT], onlyActive: false, originRect },
            selectedAccountId => {
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

    const { ref: fromRowRef, handlePress: handleFromPress } = useMeasureInWindowPress(
        originRect => void handleAccountPress('fromAccountId', fromAccountId, toAccountId, originRect)
    );
    const { ref: toRowRef, handlePress: handleToPress } = useMeasureInWindowPress(
        originRect => void handleAccountPress('toAccountId', toAccountId, fromAccountId, originRect)
    );

    return {
        ...accounts,
        fromRowRef,
        toRowRef,
        handleFromPress,
        handleToPress,
        handleSwap,
        canSwap: isDefined(fromAccountId) && isDefined(toAccountId),
        hasAnyAccount: isDefined(fromAccountId) || isDefined(toAccountId)
    };
};
