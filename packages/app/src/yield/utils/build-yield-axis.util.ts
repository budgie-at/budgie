import { isPositiveNumber } from '@rnw-community/shared';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const LABEL_HEADROOM = 20;
const EMPTY_TOP = 1;

export const buildYieldAxis = (maxValue: number, depthBelowZero: number, height: number): YieldAxisInterface => {
    const top = (Math.max(maxValue, 0) + (LABEL_HEADROOM * depthBelowZero) / height) / (1 - LABEL_HEADROOM / height);

    return { top: Number.isFinite(top) && isPositiveNumber(top) ? top : EMPTY_TOP, bottom: -depthBelowZero };
};
