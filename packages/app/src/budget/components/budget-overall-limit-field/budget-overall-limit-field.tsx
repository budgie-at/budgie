import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetEditableAmountInput } from '../budget-editable-amount-input/budget-editable-amount-input';

interface Props {
    readonly control: Control<BudgetFormValues>;
    readonly currencySymbol: string;
}

export const BudgetOverallLimitField = ({ control, currencySymbol }: Props) => {
    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'overallLimit'>) => (
        <BudgetEditableAmountInput
            testID={BudgetSelector.SetupOverallLimitInput}
            value={value}
            currencySymbol={currencySymbol}
            className="h-[40px] text-(length:--text-xl) font-semibold"
            onChangeValue={onChange}
        />
    );

    return <Controller control={control} name="overallLimit" render={render} />;
};
