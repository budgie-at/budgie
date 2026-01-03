import { BudgetCreateInputInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetStartDaySelector } from '../budget-start-day-selector/budget-start-day-selector';

interface Props {
    readonly control: Control<BudgetCreateInputInterface>;
    readonly period: BudgetPeriodEnum;
    readonly label: string;
}

export const BudgetStartDayField = ({ control, period, label }: Props) => {
    const renderInput = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<BudgetCreateInputInterface, 'startDay'>) => (
        <FormItem label={label} error={error?.message}>
            <BudgetStartDaySelector period={period} value={value ?? 1} onSelect={onChange} />
        </FormItem>
    );

    return <Controller control={control} name="startDay" render={renderInput} />;
};
