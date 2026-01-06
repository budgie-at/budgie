import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

type IbanFieldProps<T extends { iban?: string | null }> = {
    readonly control: Control<T>;
};

export const IbanField = <T extends { iban?: string | null }>({ control }: IbanFieldProps<T>) => {
    const { t } = useLingui();

    const renderIbanField = ({ field, fieldState }: UseControllerReturn<T, FieldPath<T>>) => {
        const status = fieldState.invalid ? 'error' : 'default';

        return (
            <FormItem label={t`IBAN`} error={fieldState.error?.message}>
                <Input
                    size="lg"
                    status={status}
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    placeholder={t`e.g. DE89370400440532013000`}
                    autoCapitalize="characters"
                    maxLength={34}
                />
            </FormItem>
        );
    };

    return <Controller control={control} name={'iban' as FieldPath<T>} render={renderIbanField} />;
};
