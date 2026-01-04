import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

export const RuleTitleField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderTitleInput = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'title'>) => (
        <Input value={value} onChangeText={onChange} placeholder={t`e.g., Grocery Transactions`} />
    );

    return (
        <FormItem label={t`Title`}>
            <Controller control={control} name="title" render={renderTitleInput} />
        </FormItem>
    );
};
