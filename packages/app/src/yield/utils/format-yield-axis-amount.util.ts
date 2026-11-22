import { formatYieldCompactAmount } from './format-yield-compact-amount.util';

const MAX_FRACTION_DIGITS = 8;
const EPSILON = 1e-9;

const resolveShortestDigits = (scaled: number): number =>
    Array.from({ length: MAX_FRACTION_DIGITS + 1 }, (_, index) => index).find(
        candidate => Math.abs(Number(scaled.toFixed(candidate)) - scaled) < EPSILON
    ) ?? MAX_FRACTION_DIGITS;

export const formatYieldAxisAmount = (
    value: number,
    symbol: string,
    formatNumber: (absolute: number, fractionDigits: number) => string
): string => formatYieldCompactAmount(value, symbol, scaled => formatNumber(scaled, resolveShortestDigits(scaled)));
