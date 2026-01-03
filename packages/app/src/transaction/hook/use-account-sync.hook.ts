import { useWatch } from 'react-hook-form';

import { useTransactionFormContext } from '../context/transaction-form.context';

export const useAccountSync = () => {
    const { control, setValue } = useTransactionFormContext();
    const entries = useWatch({ control, name: 'entries' });

    const handleSingleAccountChange = (fieldName: 'fromAccountId' | 'toAccountId', accountId: number) => {
        setValue(fieldName, accountId);
        entries.forEach((_, index) => {
            setValue(`entries.${index}.accountId`, accountId);
        });
    };

    const handleTransferAccountsChange = (fromAccountId: number, toAccountId: number) => {
        setValue('fromAccountId', fromAccountId);
        setValue('toAccountId', toAccountId);

        if (entries.length >= 2) {
            setValue('entries.0.accountId', fromAccountId);
            setValue('entries.1.accountId', toAccountId);
        }
    };

    return {
        handleSingleAccountChange,
        handleTransferAccountsChange
    };
};
