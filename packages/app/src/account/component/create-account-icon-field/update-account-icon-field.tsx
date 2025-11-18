import { AccountCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/components/form-item/form-item';
import { IconSelector } from '../../../@generic/components/icon-selector/icon-selector';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
}

export const UpdateAccountIconField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderIconSelector = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'icon'>) => (
        <FormItem label={t`Icon`}>
            <IconSelector size='lg' icon={value} onSelect={onChange} />
        </FormItem>
    );

    return <Controller control={control} name='icon' render={renderIconSelector} />;
};
