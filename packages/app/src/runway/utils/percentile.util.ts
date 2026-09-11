import { isEmptyArray } from '@rnw-community/shared';

export const percentile = (values: readonly number[], percentileRank: number): number => {
    if (isEmptyArray(values)) {
        return 0;
    }

    const sortedValues = [...values].sort((left, right) => left - right);
    const clampedRank = Math.min(1, Math.max(0, percentileRank));
    const position = clampedRank * (sortedValues.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (lowerIndex === upperIndex) {
        return sortedValues[lowerIndex];
    }

    const weight = position - lowerIndex;

    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
};
