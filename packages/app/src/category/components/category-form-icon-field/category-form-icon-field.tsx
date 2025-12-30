import { CategoryCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { IconSelector } from '../../../@generic/component/icon-selector/icon-selector';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly control: Control<CategoryCreateEntityInterface>;
}

const iconParams = { variant: 'default', size: 36, iconSize: 20, border: false } as const;

export const CategoryFormIconField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange }, fieldState: { error } }: UseControllerReturn<CategoryCreateEntityInterface, 'icon'>) => (
        <FormItem label={t`Icon`} error={error?.message}>
            <IconSelector
                trigger={<SimpleHorizontalCell title={value} icon={value} iconParams={iconParams} />}
                variant="default"
                icon={value}
                onSelect={onChange}
            />
        </FormItem>
    );

    return <Controller name="icon" control={control} render={render} />;
};
