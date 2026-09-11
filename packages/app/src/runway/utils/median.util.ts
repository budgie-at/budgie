import { isEmptyArray } from '@rnw-community/shared';

export const median = (values: readonly number[]): number => {
    if (isEmptyArray(values)) {
        return 0;
    }

    const sortedValues = [...values].sort((left, right) => left - right);
    const middleIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0) {
        return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    }

    return sortedValues[middleIndex];
};
