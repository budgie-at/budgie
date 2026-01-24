import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';

import { ColorPaletteVariant } from '../type/color-palette-variant.type';

export const CONFIRM_ACTION_CARD_VARIANTS = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'mx-5xl rounded-5xl overflow-hidden border-2 shadow-[0px_0px_15px_-8px]',
    {
        variants: {
            variant: {
                'dark-warning': 'border-dark-warning-corner shadow-dark-warning-corner/75',
                destructive: 'border-destructive-corner shadow-destructive-corner/75',
                secondary: 'border-secondary-corner shadow-secondary-corner/75',
                positive: 'border-positive-corner shadow-positive-corner/75',
                warning: 'border-warning-corner shadow-warning-corner/75',
                default: 'border-default-corner shadow-default-corner/75',
                primary: 'border-ghost-corner shadow-ghost-corner/75',
                ghost: 'border-ghost-corner shadow-ghost-corner/75',
                pink: 'border-pink-corner shadow-pink-corner/75'
            }
        }
    }
);
