export const normalizeIconSearchText = (text: string): string =>
    text.toLowerCase().normalize('NFKD').replaceAll(/\p{M}/gu, '').replaceAll(/\s+/gu, ' ').trim();
