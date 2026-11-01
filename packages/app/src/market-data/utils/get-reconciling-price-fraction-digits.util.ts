const MAX_FRACTION_DIGITS = 10;
const CENTS = 100;

const toCents = (value: number): number => Math.round(value * CENTS);

const roundToDigits = (value: number, digits: number): number => Number(value.toFixed(digits));

export const getReconcilingPriceFractionDigits = (rate: number, quantities: readonly number[], minDigits: number): number => {
    for (let digits = minDigits; digits < MAX_FRACTION_DIGITS; digits += 1) {
        const shownRate = roundToDigits(rate, digits);

        if (quantities.every(quantity => toCents(quantity * shownRate) === toCents(quantity * rate))) {
            return digits;
        }
    }

    return MAX_FRACTION_DIGITS;
};
