import { RecurringTileVariantEnum } from '../enum/recurring-tile-variant.enum';

const TILE_VARIANTS = Object.values(RecurringTileVariantEnum).filter(variant => variant !== RecurringTileVariantEnum.NEUTRAL);
const HASH_MULTIPLIER = 31;
const HASH_MODULUS = 2_147_483_647;

const hashText = (text: string): number =>
    Array.from(text).reduce((hash, character) => (hash * HASH_MULTIPLIER + (character.codePointAt(0) ?? 0)) % HASH_MODULUS, 0);

export const getRecurringTileVariant = (title: string): RecurringTileVariantEnum =>
    TILE_VARIANTS[hashText(title.trim().toLowerCase()) % TILE_VARIANTS.length];
