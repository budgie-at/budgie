import { AmountField, AmountFieldInput } from '@budgie/amount-input';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { isNumber } from '@rnw-community/shared';

import { useAmountFormat } from '../../../@generic/hook/use-amount-format.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetOverallLimitInput = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const {
        field: { value, onChange }
    } = useController({ control, name: 'overallLimit' });
    const format = useAmountFormat(0, currencySymbol);
    const amount = isNumber(value) ? value : 0;
    const [isFocused, setIsFocused] = useState(false);
    const toneClassName = isFocused ? 'text-default-foreground' : 'text-primary';

    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    return (
        <AmountField fontSize={20} className="min-h-[40px] justify-center">
            <AmountFieldInput
                testID={BudgetSelector.SetupOverallLimitInput}
                value={amount}
                format={format}
                onChangeValue={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={t`e.g. 200`}
                placeholderTextColorClassName="accent-primary/50"
                className={cn('font-semibold tabular-nums', toneClassName)}
                selectTextOnFocus
            />
        </AmountField>
    );
};
