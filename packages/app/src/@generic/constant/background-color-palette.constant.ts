/* eslint-disable lingui/no-unlocalized-strings */
import { ClassValue } from 'clsx';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export const BACKGROUND_COLOR_PALETTE: Record<ColorPaletteVariant, ClassValue> = {
    default: 'border-default-corner bg-default-background',
    destructive: 'border-destructive-corner bg-destructive-background',
    positive: 'border-positive-corner bg-positive-background',
    pink: 'border-pink-corner bg-pink-background',
    warning: 'border-warning-corner bg-warning-background',
    'dark-warning': 'border-dark-warning-corner bg-dark-warning-background',
    ghost: 'border-secondary-corner bg-ghost-background',
    secondary: 'border-secondary-corner bg-ghost-background',
    primary: 'border-secondary-corner bg-primary-reverse'
};
