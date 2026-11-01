import { isPositiveNumber } from '@rnw-community/shared';

export const getMarketChangeClassName = (value: number): string => {
    if (isPositiveNumber(value)) {
        return 'text-positive-strong';
    }

    return isPositiveNumber(-value) ? 'text-destructive-strong' : 'text-primary';
};
