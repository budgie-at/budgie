import { BudgetCreateInputInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { DateInput } from '../../../@generic/component/date-input/date-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';

interface Props {
    readonly control: Control<BudgetCreateInputInterface>;
    readonly name: 'customStartDate' | 'customEndDate';
    readonly label: string;
    readonly placeholder: string;
}

export const BudgetDateField = ({ control, name, label, placeholder }: Props) => {
    const renderInput = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<BudgetCreateInputInterface, typeof name>) => (
        <FormItem label={label} error={error?.message}>
            <DateInput value={value ?? null} onChange={onChange} placeholder={placeholder} />
        </FormItem>
    );

    return <Controller control={control} name={name} render={renderInput} />;
};
