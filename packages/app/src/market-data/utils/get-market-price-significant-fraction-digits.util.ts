const SIGNIFICANT_DIGITS = 6;
const MIN_FRACTION_DIGITS = 2;
const MAX_FRACTION_DIGITS = 12;

export const getMarketPriceSignificantFractionDigits = (price: number): number => {
    if (!Number.isFinite(price) || price <= 0) {
        return MIN_FRACTION_DIGITS;
    }

    const integerDigits = Math.floor(Math.log10(price)) + 1;

    return Math.min(MAX_FRACTION_DIGITS, Math.max(MIN_FRACTION_DIGITS, SIGNIFICANT_DIGITS - integerDigits));
};
