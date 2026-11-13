import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { ClassValue } from 'cn';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly size: number;
}

const ICON_RATIO = 0.5;

const iconPalette: Record<ColorPaletteVariant, ClassValue> = {
    ...BACKGROUND_COLOR_PALETTE,
    secondary: 'bg-secondary-foreground/15',
    positive: 'bg-positive-foreground/20',
    warning: 'bg-warning-foreground/20',
    destructive: 'bg-destructive-foreground/20',
    violet: 'bg-violet-foreground/25'
};

const containerVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('items-center justify-center rounded-full border-0', {
    variants: { variant: iconPalette }
});

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', { variants: { variant: FOREGROUND_COLOR_PALETTE } });

export const CreateMenuIcon = ({ icon, variant, size }: Props) => {
    const containerStyle = { width: size, height: size };

    return (
        <View className={containerVariants({ variant })} style={containerStyle}>
            <Icon className={iconVariants({ variant })} icon={icon} size={Math.round(size * ICON_RATIO)} />
        </View>
    );
};
