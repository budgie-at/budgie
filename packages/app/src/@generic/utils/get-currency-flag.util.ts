import circleFlags from '../../../assets/flags/circle-flags.json';

const CIRCLE_FLAGS: Readonly<Record<string, string>> = circleFlags;

export const getCurrencyFlag = (code: string): string | null => CIRCLE_FLAGS[code.slice(0, 2).toUpperCase()] ?? null;
