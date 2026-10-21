import { useAmountInput } from '@budgie/amount-input';
import { ComponentProps } from 'react';

import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { Input } from '../input/input';

interface Props extends Omit<ComponentProps<typeof Input>, 'value' | 'className'> {
    readonly value: number;
    readonly inputClassName?: string;
    readonly commitOnBlur?: boolean;
    readonly valuePrefix?: string;
    readonly minimumDecimalPlaces?: number;
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
        onFocus,
        onBlur,
        ...rest
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces, valuePrefix);
    const amountInputProps = useAmountInput({ value, format, onChangeValue, commitOnBlur, selectTextOnFocus, onFocus, onBlur });

    return <Input {...rest} {...amountInputProps} className={inputClassName} />;
};
