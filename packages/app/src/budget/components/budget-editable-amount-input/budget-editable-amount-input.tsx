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
    readonly accessibilityLabel?: string;
}

export const BudgetEditableAmountInput = <TFieldValues extends FieldValues>({
    control,
    name,
    currencySymbol,
    testID,
    className,
    accessibilityLabel
}: Props<TFieldValues>) => {
    const {
        field: { value, onChange, ref }
    } = useController({ control, name });
    const amount = isNumber(value) ? value : 0;
    const { t } = useLingui();
    const [isFocused, setIsFocused] = useState(false);
    const toneClassName = isFocused ? 'border-default-foreground text-default-foreground' : 'border-secondary-foreground/30 text-primary';

    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    return (
        <AmountInput
            ref={ref}
            testID={testID}
            accessibilityLabel={accessibilityLabel}
            value={amount}
            onChangeValue={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            borderless
            inputClassName={cn('rounded-lg border bg-surface-fill px-md', className, toneClassName)}
            selectTextOnFocus
        />
    );
};
