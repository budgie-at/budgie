import { cva } from 'class-variance-authority';
import { View, ViewStyle } from 'react-native';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { IconName } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import type { ClassValue } from 'clsx';

interface Props {
    readonly size?: number;
    readonly icon: IconName;
    readonly radius?: number;
    readonly border?: boolean;
    readonly iconSize?: number;
    readonly className?: string;
    readonly iconClassName?: string;
    readonly variant?: ColorPaletteVariant;
}

const wrapperVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
    border: Record<'true' | 'false', string>;
}>('border block items-center justify-center bg-red-500', {
    variants: {
        variant: BACKGROUND_COLOR_PALETTE,
        border: { true: 'border', false: 'border-0' }
    }
});

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const CircleIcon = (props: Props) => {
    const { size = 42, iconSize = 20, radius = 20, icon, variant = 'positive', border = true, className, iconClassName } = props;
    const style: ViewStyle = { width: size, height: size, borderRadius: radius };

    return (
        <View className={cn(wrapperVariants({ variant, border }), className)} style={style}>
            <Icon className={cn(iconVariants({ variant }), iconClassName)} icon={icon} size={iconSize} />
        </View>
    );
};
