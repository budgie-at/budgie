import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

export const BudgetNameField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<BudgetFormValues, 'name'>) => (
        <FormItem label={t`Name`}>
            <Input
                testID={BudgetSelector.SetupNameInput}
                size="md"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t`Budget name`}
            />
        </FormItem>
    );

    return <Controller control={control} name="name" render={render} />;
};
