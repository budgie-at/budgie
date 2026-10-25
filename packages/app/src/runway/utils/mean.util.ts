import { isEmptyArray } from '@rnw-community/shared';

export const mean = (values: readonly number[]): number =>
    isEmptyArray(values) ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
