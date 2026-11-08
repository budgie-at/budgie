import { ColorPaletteVariant } from '../type/color-palette-variant.type';

const WARNING_DISC_CLASSNAME = 'bg-warning-foreground/25 dark:bg-warning-foreground/40';

export const TONAL_DISC_BACKGROUND: Record<ColorPaletteVariant, string> = {
    default: 'bg-default-foreground/25',
    destructive: 'bg-destructive-foreground/25',
    positive: 'bg-positive-foreground/25',
    pink: 'bg-pink-foreground/25',
    violet: 'bg-violet-foreground/25',
    cyan: 'bg-cyan-foreground/25',
    warning: WARNING_DISC_CLASSNAME,
    'dark-warning': 'bg-dark-warning-foreground/25',
    ghost: 'bg-surface-disc',
    secondary: 'bg-surface-disc',
    primary: 'bg-surface-disc',
    cta: 'bg-surface-disc'
};
