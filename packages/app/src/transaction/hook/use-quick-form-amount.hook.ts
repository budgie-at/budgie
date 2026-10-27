import { InstrumentTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useFormContext, useWatch } from 'react-hook-form';

import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { KeypadHandlersInterface } from '../interface/keypad-handlers.interface';
import { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

import { useKeypadInput } from './use-keypad-input.hook';

interface UseQuickFormAmountConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
}

interface UseQuickFormAmountResult {
    readonly displayValue: string;
    readonly numericValue: number;
    readonly currencySymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly keypadHandlers: KeypadHandlersInterface;
    readonly setFromNumeric: (value: number) => void;
}

export const useQuickFormAmount = ({ accountFieldName }: UseQuickFormAmountConfig): UseQuickFormAmountResult => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
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
    const instrumentType = account?.instrument.type ?? defaultInstrument.type;

    return { displayValue, numericValue, currencySymbol, instrumentType, keypadHandlers: handlers, setFromNumeric };
};
