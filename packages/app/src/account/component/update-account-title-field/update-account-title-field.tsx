import { ACCOUNT_TITLE_MAX_LENGTH, AccountCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
}

export const UpdateAccountTitleField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderAccountTitle = ({
        field: { value, onChange },
        fieldState: { error, invalid }
    }: UseControllerReturn<AccountCreateEntityInterface, 'title'>) => {
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

    return <Controller control={control} name="title" render={renderAccountTitle} />;
};
