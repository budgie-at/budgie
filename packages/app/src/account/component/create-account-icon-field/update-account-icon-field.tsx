import { AccountCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { IconSelector } from '../../../@generic/component/icon-selector/icon-selector';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
    readonly variant: ColorPaletteVariant;
}

export const UpdateAccountIconField = ({ control, variant }: Props) => {
    const { t } = useLingui();

    const renderIconSelector = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'icon'>) => (
        <FormItem label={t`Icon`}>
            <IconSelector size="lg" icon={value} onSelect={onChange} variant={variant} />
        </FormItem>
    );

    return <Controller control={control} name="icon" render={renderIconSelector} />;
};
