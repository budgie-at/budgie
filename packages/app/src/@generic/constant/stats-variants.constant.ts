import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

import { FOREGROUND_COLOR_PALETTE } from './foreground-color-palette.constant';

export const statsAmountVariants = cva('text-xs', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const statsBarVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('h-[8px] rounded-5xl', {
    variants: {
        variant: {
            'dark-warning': 'bg-dark-warning-foreground',
            destructive: 'bg-destructive-foreground',
            secondary: 'bg-secondary-foreground',
            positive: 'bg-positive-foreground',
            warning: 'bg-warning-foreground',
            default: 'bg-default-foreground',
            ghost: 'bg-ghost-foreground',
            pink: 'bg-pink-foreground',
            primary: 'bg-primary',
            cta: 'bg-cta-foreground'
        }
    }
});
