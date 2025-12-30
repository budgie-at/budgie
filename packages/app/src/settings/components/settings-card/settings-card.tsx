import { ComponentProps } from 'react';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props extends Omit<ComponentProps<typeof SimpleHorizontalCell>, 'iconParams'> {
    readonly variant?: ColorPaletteVariant;
}

export const SettingsCard = ({ variant, ...rest }: Props) => {
    const iconParams = { variant, border: false, size: 36, iconSize: 20 } as const;

    return <SimpleHorizontalCell iconParams={iconParams} {...rest} />;
};
