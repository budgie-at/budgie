import type { ColorPaletteVariant } from '../type/color-palette-variant.type';

const MONOGRAM_TINTS: readonly ColorPaletteVariant[] = ['default', 'positive', 'violet', 'cyan'];

export const getMonogramTint = (value: string): ColorPaletteVariant =>
    MONOGRAM_TINTS[Array.from(value).reduce((hash, character) => hash + character.charCodeAt(0), 0) % MONOGRAM_TINTS.length] ?? 'default';
