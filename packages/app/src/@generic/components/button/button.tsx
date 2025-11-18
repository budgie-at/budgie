import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ComponentProps } from 'react';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

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
        variant: {
            default: 'bg-default-background border-default-corner',
            destructive: 'bg-destructive-background border-destructive-corner',
            'dark-warning': 'bg-dark-warning-background border-dark-warning-corner',
            positive: 'bg-positive-background border-positive-corner',
            warning: 'bg-warning-background border-warning-corner',
            ghost: 'bg-ghost-background border-ghost-corner'
        },
        size: {
            sm: 'rounded-2xl p-2xl',
            md: 'rounded-3xl p-3xl'
        }
    }
});

const textVariants = cva('', {
    variants: {
        size: {
            sm: 'font-medium text-sm',
            md: 'font-semibold text-md'
        },
        variant: {
            default: 'text-default-foreground',
            destructive: 'text-destructive-foreground',
            positive: 'text-positive-foreground',
            warning: 'text-warning-foreground',
            'dark-warning': 'text-dark-warning-foreground',
            ghost: 'text-ghost-foreground'
        }
    }
});

export const Button = ({ content, onPress, disabled, leftIcon, rightIcon, className, variant = 'ghost', size = 'md', ...rest }: Props) => (
    <HapticPressable onPress={onPress} className={cn(buttonVariants({ disabled, size, variant }), className)} {...rest}>
        {isNotEmptyString(leftIcon) ? <Icon className={textVariants({ variant })} size={16} icon={ICONS[leftIcon]} /> : null}

        <Text className={textVariants({ variant })}>{content}</Text>

        {isNotEmptyString(rightIcon) ? <Icon className={textVariants({ variant })} size={16} icon={ICONS[rightIcon]} /> : null}
    </HapticPressable>
);
