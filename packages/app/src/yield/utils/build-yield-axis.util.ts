import { isPositiveNumber } from '@rnw-community/shared';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const HEADROOM = 1.1;
const EMPTY_TOP = 1;
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const;
const LARGEST_STEP = 10;

export const buildYieldAxis = (maxValue: number, depthBelowZero: number): YieldAxisInterface => {
    const padded = Math.max(maxValue, 0) * HEADROOM;

    if (!Number.isFinite(padded) || !isPositiveNumber(padded)) {
        return { top: EMPTY_TOP, bottom: -depthBelowZero };
    }

    const magnitude = 10 ** Math.floor(Math.log10(padded));
    const step = NICE_STEPS.find(candidate => candidate * magnitude >= padded) ?? LARGEST_STEP;

    return { top: step * magnitude, bottom: -depthBelowZero };
};
