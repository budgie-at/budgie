import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';

export const BudgetFundNameField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFundFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<BudgetFundFormValues, 'name'>) => (
        <FormItem label={t`Name`}>
            <Input
                testID={BudgetSelector.FundNameInput}
                size="md"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={t`e.g. Car insurance`}
            />
        </FormItem>
    );

    return <Controller control={control} name="name" render={render} />;
};
