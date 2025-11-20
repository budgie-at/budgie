import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ComponentProps } from 'react';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ICONS, IconName } from '../../constant/icons.constant';
import { ButtonSizeType } from '../../type/button-size.type';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props extends ComponentProps<typeof HapticPressable> {
    readonly content: string;
    readonly leftIcon?: IconName;
    readonly rightIcon?: IconName;
    readonly size?: ButtonSizeType;
    readonly variant?: ColorPaletteVariant;
}

const buttonVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
    size: Record<ButtonSizeType, ClassValue>;
    disabled: Record<'true', ClassValue>;
}>('flex-row items-center gap-x-xl justify-center border', {
    variants: {
        disabled: { true: 'opacity-50' },
        variant: BACKGROUND_COLOR_PALETTE,
        size: {
            sm: 'rounded-2xl p-2xl',
            md: 'rounded-3xl p-3xl'
        }
    }
});

const textVariants = cva<{
    size: Record<ButtonSizeType, ClassValue>;
    variant: Record<ColorPaletteVariant, ClassValue>;
}>('', {
    variants: {
        size: {
            sm: 'font-medium text-sm',
            md: 'font-semibold text-md'
        },
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const Button = ({ content, onPress, disabled, leftIcon, rightIcon, className, variant = 'ghost', size = 'md', ...rest }: Props) => (
    <HapticPressable onPress={onPress} className={cn(buttonVariants({ disabled, size, variant }), className)} {...rest}>
        {isNotEmptyString(leftIcon) ? <Icon className={textVariants({ variant })} size={16} icon={ICONS[leftIcon]} /> : null}

        <Text className={textVariants({ variant })}>{content}</Text>

        {isNotEmptyString(rightIcon) ? <Icon className={textVariants({ variant })} size={16} icon={ICONS[rightIcon]} /> : null}
    </HapticPressable>
);
