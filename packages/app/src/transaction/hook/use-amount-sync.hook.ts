import { useWatch } from 'react-hook-form';

import { useTransactionFormContext } from '../context/transaction-form.context';

export const useAmountSync = () => {
    const { control, setValue } = useTransactionFormContext();
    const entries = useWatch({ control, name: 'entries' });

    const handleAmountChange = (amount: number) => {
        setValue('amount', amount);

        if (entries.length === 1) {
            setValue('entries.0.amount', amount);
        } else if (entries.length === 2) {
            setValue('entries.0.amount', amount);
            setValue('entries.1.amount', amount);
        }
    };

    return { handleAmountChange };
};
