export const normalizeIconSearchText = (text: string): string =>
    text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/\s+/gu, ' ').trim();
