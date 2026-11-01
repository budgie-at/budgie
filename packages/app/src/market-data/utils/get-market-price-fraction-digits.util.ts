const DEFAULT_FRACTION_DIGITS = 2;
const MIN_TINY_FRACTION_DIGITS = 4;
const MAX_TINY_FRACTION_DIGITS = 8;
const TINY_PRICE_EXTRA_DIGITS = 2;

export const getMarketPriceFractionDigits = (price: number): number => {
    if (!(price > 0) || price >= 1) {
        return DEFAULT_FRACTION_DIGITS;
    }

    const digits = Math.ceil(-Math.log10(price)) + TINY_PRICE_EXTRA_DIGITS;

    return Math.min(MAX_TINY_FRACTION_DIGITS, Math.max(MIN_TINY_FRACTION_DIGITS, digits));
};
