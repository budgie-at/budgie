import { ClassValue } from 'cn';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export const FOREGROUND_COLOR_PALETTE: Record<ColorPaletteVariant, ClassValue> = {
    default: 'text-default-foreground',
    destructive: 'text-destructive-foreground',
    positive: 'text-positive-foreground',
    pink: 'text-pink-foreground',
    violet: 'text-violet-foreground',
    cyan: 'text-cyan-foreground',
    warning: 'text-warning-foreground',
    'dark-warning': 'text-dark-warning-foreground',
    ghost: 'text-ghost-foreground',
    secondary: 'text-secondary-foreground',
    primary: 'text-primary',
    cta: 'text-cta-foreground'
};
