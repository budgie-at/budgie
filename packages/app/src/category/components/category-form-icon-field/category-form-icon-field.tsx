import { CategoryCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { IconSelector } from '../../../@generic/component/icon-selector/icon-selector';

interface Props {
    readonly control: Control<CategoryCreateEntityInterface>;
}

export const CategoryFormIconField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<CategoryCreateEntityInterface, 'icon'>) => (
        <FormItem label={t`Icon`} error={error?.message}>
            <IconSelector variant="default" icon={value} onSelect={onChange} />
        </FormItem>
    );

    return <Controller name="icon" control={control} render={render} />;
};
