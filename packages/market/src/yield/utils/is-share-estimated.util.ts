import { isPositiveNumber } from '@rnw-community/shared';

const ESTIMATE_SHARE = 0.05;

export const isShareEstimated = (estimated: number, total: number) => isPositiveNumber(total) && estimated / total >= ESTIMATE_SHARE;
