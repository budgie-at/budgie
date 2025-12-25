import { ACCOUNT_TITLE_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props<T extends { title: string }> {
    readonly control: Control<T>;
}

export const UpdateAccountTitleField = <T extends { title: string }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const renderAccountTitle = ({ field: { value, onChange }, fieldState: { error, invalid } }: UseControllerReturn<T, FieldPath<T>>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account Name`} error={error?.message}>
                <Input
                    size="lg"
                    value={value}
                    status={status}
                    onChangeText={onChange}
                    className="text-ellipsis"
                    maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                    placeholder={t`e.g. Savings Account`}
                />
            </FormItem>
        );
    };

    return <Controller control={control} name={'title' as FieldPath<T>} render={renderAccountTitle} />;
};
