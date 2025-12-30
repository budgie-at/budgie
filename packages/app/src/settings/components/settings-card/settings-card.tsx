import { ComponentProps } from 'react';
import { ActivityIndicator } from 'react-native';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props extends Omit<ComponentProps<typeof SimpleHorizontalCell>, 'iconParams'> {
    readonly variant?: ColorPaletteVariant;
    readonly isLoading?: boolean;
}

export const SettingsCard = ({ variant, isLoading = false, disabled, right, ...rest }: Props) => {
    const iconParams = { variant, border: false, size: 36, iconSize: 20 } as const;
    const rightSlot = isLoading ? <ActivityIndicator size="small" /> : right;
    const isDisabled = isLoading || disabled;

    return <SimpleHorizontalCell iconParams={iconParams} disabled={isDisabled} right={rightSlot} {...rest} />;
};
