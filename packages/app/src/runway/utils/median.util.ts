import { percentile } from './percentile.util';

const MEDIAN_RANK = 0.5;

export const median = (values: readonly number[]): number => percentile(values, MEDIAN_RANK);
