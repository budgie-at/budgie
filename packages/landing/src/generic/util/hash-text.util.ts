const HASH_SEED = 7;
const HASH_MULTIPLIER = 31;
const HASH_MODULO = 100003;

export const hashText = (value: string): number =>
    Array.from(value).reduce((total, character) => (total * HASH_MULTIPLIER + character.charCodeAt(0)) % HASH_MODULO, HASH_SEED);
