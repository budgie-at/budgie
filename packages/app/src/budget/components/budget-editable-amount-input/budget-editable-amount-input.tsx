import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { isNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props<TFieldValues extends FieldValues> {
    readonly control: Control<TFieldValues>;
    readonly name: FieldPathByValue<TFieldValues, number>;
    readonly currencySymbol: string;
    readonly testID?: string;
}

export const BudgetEditableAmountInput = <TFieldValues extends FieldValues>({
    control,
    name,
    currencySymbol,
    testID
}: Props<TFieldValues>) => {
    const {
        field: { value, onChange }
    } = useController({ control, name });
    const amount = isNumber(value) ? value : 0;
    const { t } = useLingui();
    const [isFocused, setIsFocused] = useState(false);
    const toneClassName = isFocused ? 'text-default-foreground' : 'text-primary';
    const widthClassName = useIsLargeTextSize() ? 'w-full' : 'min-w-[104px] max-w-[136px]';

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
            inputClassName={cn('px-0 text-right', widthClassName, toneClassName)}
            selectTextOnFocus
        />
    );
};
