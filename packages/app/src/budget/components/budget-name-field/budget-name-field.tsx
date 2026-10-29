import { useLingui } from '@lingui/react/macro';
import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';

import { isString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props<TFieldValues extends FieldValues> {
    readonly control: Control<TFieldValues>;
    readonly name: FieldPathByValue<TFieldValues, string>;
    readonly placeholder: string;
    readonly testID: string;
}

export const BudgetNameField = <TFieldValues extends FieldValues>({ control, name, placeholder, testID }: Props<TFieldValues>) => {
    const { t } = useLingui();
    const {
        field: { value, onChange, onBlur }
    } = useController({ control, name });

    const nameValue = isString(value) ? value : '';

    return (
        <FormItem label={t`Name`}>
            <Input testID={testID} size="md" value={nameValue} onChangeText={onChange} onBlur={onBlur} placeholder={placeholder} />
        </FormItem>
    );
};
