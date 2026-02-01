import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useKeypadInput } from './use-keypad-input.hook';

type AccountFieldName = 'fromAccountId' | 'toAccountId';

interface UseQuickFormAmountConfig {
    readonly accountFieldName: AccountFieldName;
}

interface UseQuickFormAmountResult {
    readonly displayValue: string;
    readonly numericValue: number;
    readonly currencySymbol: string;
    readonly keypadHandlers: ReturnType<typeof useKeypadInput>['handlers'];
    readonly setFromNumeric: (value: number) => void;
}

export const useQuickFormAmount = ({ accountFieldName }: UseQuickFormAmountConfig): UseQuickFormAmountResult => {
    const { defaultInstrument } = useSettingsContext();
    const { control, setValue, getValues } = useFormContext<TransactionCreateInputInterface>();

    const initialAmount = getValues('amount');

    const handleAmountChange = (value: number) => {
        setValue('amount', value);
    };

    const { displayValue, numericValue, handlers, setFromNumeric } = useKeypadInput({
        initialValue: initialAmount,
        onChange: handleAmountChange
    });

    const accountId = useWatch({ control, name: accountFieldName });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    return { displayValue, numericValue, currencySymbol, keypadHandlers: handlers, setFromNumeric };
};
