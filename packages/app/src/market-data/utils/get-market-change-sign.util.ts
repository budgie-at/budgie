import { isPositiveNumber } from '@rnw-community/shared';

export const getMarketChangeSign = (value: number): string => {
    if (isPositiveNumber(value)) {
        return '+';
    }

    return isPositiveNumber(-value) ? '−' : '';
};
