import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';

import type { AnchoredMorphOriginInterface } from '../../@generic/interface/anchored-morph-origin.interface';

export const useTransactionAccountSelector = (fieldName: 'fromAccountId' | 'toAccountId') => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const accountId = useWatch({ control, name: fieldName });
    const transactionType = useWatch({ control, name: 'type' });

    const handleOpenAccountSelector = (origin: AnchoredMorphOriginInterface) => {
        const isExpenseSourceAccount = transactionType === TransactionTypeEnum.EXPENSE && fieldName === 'fromAccountId';
        openAccountSelector(
            {
                initialAccountId: accountId,
                onlyActive: false,
                origin,
                ...(isExpenseSourceAccount && { excludeAccountTypes: [AccountTypeEnum.DEPOSIT] })
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue(fieldName, selectedAccountId, { shouldDirty: true });
                }
            }
        );
    };

    return { accountId, handleOpenAccountSelector };
};
