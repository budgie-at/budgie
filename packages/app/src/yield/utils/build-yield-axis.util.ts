import { isPositiveNumber } from '@rnw-community/shared';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const EMPTY_TOP = 1;
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;
const LARGEST_STEP = 10;

export const buildYieldAxis = (maxValue: number, depthBelowZero: number): YieldAxisInterface => {
    const peak = Math.max(maxValue, 0);

    if (!Number.isFinite(peak) || !isPositiveNumber(peak)) {
        return { top: EMPTY_TOP, bottom: -depthBelowZero, depth: depthBelowZero };
    }

    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const step = NICE_STEPS.find(candidate => candidate * magnitude >= peak) ?? LARGEST_STEP;

    return { top: step * magnitude, bottom: -depthBelowZero, depth: depthBelowZero };
};
