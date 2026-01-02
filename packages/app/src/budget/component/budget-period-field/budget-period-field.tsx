import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetFormValues } from '../../schema/budget-form.schema';
import { BudgetPeriodSelector } from '../budget-period-selector/budget-period-selector';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetPeriodField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderInput = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<BudgetFormValues, 'period'>) => (
        <FormItem label={t`Budget Period`} error={error?.message}>
            <BudgetPeriodSelector value={value} onSelect={onChange} />
        </FormItem>
    );

    return <Controller control={control} name="period" render={renderInput} />;
};
