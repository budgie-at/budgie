import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';

export const BudgetEventNameField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<BudgetEventFormValues, 'name'>) => (
        <FormItem label={t`Name`}>
            <Input
                testID={BudgetSelector.EventNameInput}
                size="md"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t`e.g. Japan trip`}
            />
        </FormItem>
    );

    return <Controller control={control} name="name" render={render} />;
};
