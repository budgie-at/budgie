import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { isNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { cn } from '../../../@generic/utils/cn.util';

interface Props<TFieldValues extends FieldValues> {
    readonly control: Control<TFieldValues>;
    readonly name: FieldPathByValue<TFieldValues, number>;
    readonly currencySymbol: string;
    readonly testID?: string;
    readonly className: string;
}

export const BudgetEditableAmountInput = <TFieldValues extends FieldValues>({
    control,
    name,
    currencySymbol,
    testID,
    className
}: Props<TFieldValues>) => {
    const {
        field: { value, onChange }
    } = useController({ control, name });
    const amount = isNumber(value) ? value : 0;
    const { t } = useLingui();
    const [isFocused, setIsFocused] = useState(false);
    const toneClassName = isFocused ? 'text-default-foreground' : 'text-primary';

    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    return (
        <AmountInput
            testID={testID}
            value={amount}
            onChangeValue={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            borderless
            inputClassName={cn('px-0', className, toneClassName)}
            selectTextOnFocus
        />
    );
};
