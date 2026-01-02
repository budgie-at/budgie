import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { BudgetFormValues } from '../../schema/budget-form.schema';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetTitleField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderInput = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<BudgetFormValues, 'title'>) => (
        <FormItem label={t`Budget Name`} error={error?.message}>
            <Input placeholder={t`e.g., Monthly Budget`} value={value} onChangeText={onChange} autoCapitalize="sentences" />
        </FormItem>
    );

    return <Controller control={control} name="title" render={renderInput} />;
};
