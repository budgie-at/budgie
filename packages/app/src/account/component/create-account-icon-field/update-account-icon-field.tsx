import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { IconSelector } from '../../../@generic/component/icon-selector/icon-selector';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props<T extends { icon: UserIconNameEnum }> {
    readonly control: Control<T>;
    readonly variant: ColorPaletteVariant;
}

export const UpdateAccountIconField = <T extends { icon: UserIconNameEnum }>({ control, variant }: Props<T>) => {
    const { t } = useLingui();

    const renderIconSelector = ({ field: { value, onChange } }: UseControllerReturn<T, FieldPath<T>>) => (
        <FormItem label={t`Icon`}>
            <IconSelector size="lg" icon={value} onSelect={onChange} variant={variant} />
        </FormItem>
    );

    return <Controller control={control} name={'icon' as FieldPath<T>} render={renderIconSelector} />;
};
