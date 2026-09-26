import { cva } from 'class-variance-authority';

import { BACKGROUND_COLOR_PALETTE } from '../../@generic/constant/background-color-palette.constant';

import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { ClassValue } from 'cn';

export const categorizeInboxChipVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'min-h-10 flex-row items-center gap-xs rounded-xl border px-md',
    { variants: { variant: BACKGROUND_COLOR_PALETTE } }
);
