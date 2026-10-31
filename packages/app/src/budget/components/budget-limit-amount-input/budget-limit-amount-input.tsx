import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetEditableAmountInput } from '../budget-editable-amount-input/budget-editable-amount-input';

interface Props {
    readonly currencySymbol: string;
    readonly name: `categoryLimits.${number}.limitAmount` | 'otherLimit';
    readonly testID?: string;
}

export const BudgetLimitAmountInput = ({ currencySymbol, name, testID }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, Props['name']>) => (
        <BudgetEditableAmountInput
            testID={testID}
            value={value}
            currencySymbol={currencySymbol}
            className="min-w-[104px] max-w-[136px] text-right"
            onChangeValue={onChange}
        />
    );

    return <Controller control={control} name={name} render={render} />;
};
