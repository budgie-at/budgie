import { roundHalfExpand } from './round-half-expand.util';

const MAX_FRACTION_DIGITS = 18;
const MONEY_FRACTION_DIGITS = 2;

export const getReconcilingPriceFractionDigits = (rate: number, quantities: readonly number[], minDigits: number): number | null => {
    for (let digits = minDigits; digits <= MAX_FRACTION_DIGITS; digits += 1) {
        const shownRate = roundHalfExpand(rate, digits);

        if (
            quantities.every(
                quantity =>
                    roundHalfExpand(quantity * shownRate, MONEY_FRACTION_DIGITS) === roundHalfExpand(quantity * rate, MONEY_FRACTION_DIGITS)
            )
        ) {
            return digits;
        }
    }

    return null;
};
