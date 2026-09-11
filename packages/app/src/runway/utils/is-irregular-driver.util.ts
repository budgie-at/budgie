import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

export const isIrregularDriver = (monthlyAmounts: readonly number[], cvThreshold: number, concentrationThreshold: number): boolean => {
    if (isEmptyArray(monthlyAmounts)) {
        return false;
    }

    const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

    if (!isPositiveNumber(total)) {
        return false;
    }

    const mean = total / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + (amount - mean) ** 2, 0) / monthlyAmounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const concentration = Math.max(...monthlyAmounts) / total;

    return coefficientOfVariation > cvThreshold || concentration >= concentrationThreshold;
};
