const MAX_FRACTION_DIGITS = 12;
const SIGNIFICANT_FIGURES = 2;

export const getMarketChangeFractionDigits = (delta: number, priceFractionDigits: number): number => {
    const magnitude = Math.abs(delta);

    if (magnitude === 0 || !Number.isFinite(magnitude)) {
        return priceFractionDigits;
    }

    const significantDigits = Math.ceil(-Math.log10(magnitude)) + SIGNIFICANT_FIGURES - 1;

    return Math.min(MAX_FRACTION_DIGITS, Math.max(priceFractionDigits, significantDigits));
};
