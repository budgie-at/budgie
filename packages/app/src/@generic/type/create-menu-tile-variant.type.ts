import type { ColorPaletteVariant } from './color-palette-variant.type';

export type CreateMenuTileVariant = Extract<ColorPaletteVariant, 'cyan' | 'default' | 'destructive' | 'positive' | 'violet'>;
