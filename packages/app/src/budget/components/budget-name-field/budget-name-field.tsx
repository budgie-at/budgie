import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetNameField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'name'>) => (
        <FormItem label={t`Name (optional)`}>
            <Input size="lg" value={value} onChangeText={onChange} placeholder={t`e.g. Household, Personal`} autoCapitalize="words" />
        </FormItem>
    );

    return <Controller control={control} name="name" render={render} />;
};
