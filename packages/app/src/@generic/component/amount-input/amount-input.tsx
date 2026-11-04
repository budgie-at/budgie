import { useAmountInput } from '@budgie/amount-input';
import { ComponentProps } from 'react';

import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { normalizeAmountDecimalSeparators } from '../../utils/normalize-amount-decimal-separators.util';
import { Input } from '../input/input';

interface Props extends Omit<ComponentProps<typeof Input>, 'value' | 'className'> {
    readonly value: number;
    readonly inputClassName?: string;
    readonly commitOnBlur?: boolean;
    readonly valuePrefix?: string;
    readonly minimumDecimalPlaces?: number;
    readonly acceptedDecimalSeparators?: readonly string[];
    readonly onChangeValue: (value: number) => void;
}

export const AmountInput = (props: Props) => {
    const {
        value,
        onChangeValue,
        inputClassName,
        commitOnBlur,
        selectTextOnFocus,
        valuePrefix,
        minimumDecimalPlaces = 0,
        acceptedDecimalSeparators = [],
        onFocus,
        onBlur,
        ...rest
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces, valuePrefix);
    const amountInputProps = useAmountInput({ value, format, onChangeValue, commitOnBlur, selectTextOnFocus, onFocus, onBlur });

    const handleChangeText = (text: string) => {
        amountInputProps.onChangeText(normalizeAmountDecimalSeparators(text, format.decimalSeparator, acceptedDecimalSeparators));
    };

    return <Input {...rest} {...amountInputProps} onChangeText={handleChangeText} className={inputClassName} />;
};
