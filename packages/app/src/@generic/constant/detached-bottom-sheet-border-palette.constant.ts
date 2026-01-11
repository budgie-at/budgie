/* eslint-disable lingui/no-unlocalized-strings */
import { ClassValue } from 'clsx';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export const DETACHED_BOTTOM_SHEET_BORDER_PALETTE: Record<ColorPaletteVariant, ClassValue> = {
    'dark-warning': 'border-dark-warning-corner shadow-dark-warning-corner/75',
    destructive: 'border-destructive-corner shadow-destructive-corner/75',
    secondary: 'border-secondary-corner shadow-secondary-corner/75',
    positive: 'border-positive-corner shadow-positive-corner/75',
    warning: 'border-warning-corner shadow-warning-corner/75',
    default: 'border-default-corner shadow-default-corner/75',
    primary: 'border-ghost-corner shadow-ghost-corner/75',
    ghost: 'border-ghost-corner shadow-ghost-corner/75',
    pink: 'border-pink-corner shadow-pink-corner/75'
};
