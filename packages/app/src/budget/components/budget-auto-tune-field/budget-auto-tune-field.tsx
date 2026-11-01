import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetAutoTuneSwitchRow } from '../budget-auto-tune-switch-row/budget-auto-tune-switch-row';

export const BudgetAutoTuneField = () => {
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'isAutoTuneEnabled'>) => (
        <BudgetAutoTuneSwitchRow value={value} onValueChange={onChange} testID={BudgetSelector.SetupAutoTuneSwitch} />
    );

    return <Controller control={control} name="isAutoTuneEnabled" render={render} />;
};
