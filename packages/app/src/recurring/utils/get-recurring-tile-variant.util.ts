import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

const TILE_VARIANTS: readonly ColorPaletteVariant[] = ['violet', 'cyan', 'pink', 'positive', 'warning', 'default'];
const HASH_MULTIPLIER = 31;
const HASH_MODULUS = 2_147_483_647;

const hashText = (text: string): number =>
    Array.from(text).reduce((hash, character) => (hash * HASH_MULTIPLIER + (character.codePointAt(0) ?? 0)) % HASH_MODULUS, 0);

export const getRecurringTileVariant = (categoryId: number | null, title: string): ColorPaletteVariant =>
    TILE_VARIANTS[(categoryId ?? hashText(title.toLowerCase())) % TILE_VARIANTS.length];
