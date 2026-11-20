import { isPositiveNumber } from '@rnw-community/shared';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const HEADROOM = 1.02;
const EMPTY_TOP = 1;
const NICE_STEPS = [10, 12, 14, 16, 18, 20, 24, 28, 30, 36, 40, 50, 60, 70, 80, 100] as const;
const LARGEST_STEP = 100;
const STEP_SCALE = 10;

export const buildYieldAxis = (maxValue: number, depthBelowZero: number): YieldAxisInterface => {
    const padded = Math.max(maxValue, 0) * HEADROOM;

    if (!Number.isFinite(padded) || !isPositiveNumber(padded)) {
        return { top: EMPTY_TOP, bottom: -depthBelowZero };
    }

    const magnitude = 10 ** Math.floor(Math.log10(padded));
    const step = NICE_STEPS.find(candidate => (candidate * magnitude) / STEP_SCALE >= padded) ?? LARGEST_STEP;

    return { top: (step * magnitude) / STEP_SCALE, bottom: -depthBelowZero };
};
