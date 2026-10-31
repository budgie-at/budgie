import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly value: number;
    readonly currencySymbol: string;
    readonly testID?: string;
    readonly className: string;
    readonly onChangeValue: (value: number) => void;
}

export const BudgetEditableAmountInput = ({ value, currencySymbol, testID, className, onChangeValue }: Props) => {
    const { t } = useLingui();
    const [isFocused, setIsFocused] = useState(false);
    const toneClassName = isFocused ? 'text-default-foreground' : 'text-secondary-foreground';

    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    return (
        <AmountInput
            testID={testID}
            value={value}
            onChangeValue={onChangeValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            borderless
            inputClassName={cn('px-0', className, toneClassName)}
            commitOnBlur
            selectTextOnFocus
        />
    );
};
