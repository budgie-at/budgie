import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import type { CircleIconSize } from '../../type/circle-icon-size.type';
import type { ClassValue } from 'clsx';
import type { LucideIcon } from 'lucide-react-native';

interface Props {
    readonly size?: CircleIconSize;
    readonly border?: boolean;
    readonly icon: LucideIcon;
    readonly className?: string;
    readonly iconClassName?: string;
    readonly variant?: ColorPaletteVariant;
}

const wrapperVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
    size: Record<CircleIconSize, ClassValue>;
    border: Record<'true' | 'false', string>;
}>('rounded-full border block items-center justify-center', {
    variants: {
        variant: {
            positive: 'border-positive-corner bg-positive-background',
            destructive: 'border-destructive-corner bg-destructive-background',
            warning: 'border-warning-corner bg-warning-background',
            'dark-warning': 'border-dark-warning-corner bg-dark-warning-background',
            default: 'border-default-corner bg-default-background',
            ghost: 'border-ghost-corner bg-ghost-background',
            pink: 'border-pink-corner bg-pink-background',
        },
        size: {
            xs: 'w-6.5 h-6.5',
            sm: 'w-7 h-7',
            md: 'w-8 h-8',
            lg: 'w-8.5 h-8.5',
            xl: 'w-9 h-9',
            '1_25xl': 'w-[36px] h-[36px]',
            '1_5xl': 'w-[40px] h-[40px]',
            '2xl': 'w-[52px] h-[52px]',
            '2_5xl': 'w-[52px] h-[52px]',
            '3xl': 'w-[62px] h-[62px]'
        },
        border: {
            true: 'border',
            false: 'border-0'
        }
    }
});

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: {
        variant: {
            positive: 'text-positive-foreground',
            destructive: 'text-destructive-foreground',
            warning: 'text-warning-foreground',
            'dark-warning': 'text-dark-warning-foreground',
            default: 'text-default-foreground',
            pink: 'text-pink-foreground',
            ghost: 'text-ghost-foreground'
        }
    }
});

const iconSize: Record<CircleIconSize, number> = {
    xs: 14,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '1_25xl': 20,
    '1_5xl': 20,
    '2xl': 24,
    '2_5xl': 28,
    '3xl': 28
};

export const CircleIcon = ({ size = 'md', icon, variant = 'positive', border = true, className, iconClassName }: Props) => (
    <View className={cn(wrapperVariants({ variant, size, border }), className)}>
        <Icon className={cn(iconVariants({ variant }), iconClassName)} icon={icon} size={iconSize[size]} />
    </View>
);
