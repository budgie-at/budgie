import { isPositiveNumber } from '@rnw-community/shared';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const EMPTY_TOP = 1;
const EMPTY_STEP = 0.5;
const STEP_FACTORS = [1, 2, 2.5, 5] as const;
const MIN_INTERVALS = 2;
const MAX_INTERVALS = 3;
const EPSILON = 1e-9;
const PRECISION = 12;

export const buildYieldAxis = (maxValue: number, depthBelowZero: number): YieldAxisInterface => {
    const peak = Math.max(maxValue, 0);

    if (!Number.isFinite(peak) || !isPositiveNumber(peak)) {
        return { top: EMPTY_TOP, bottom: -depthBelowZero, depth: depthBelowZero, step: EMPTY_STEP };
    }

    const exponent = Math.floor(Math.log10(peak));
    const fits = [exponent - 1, exponent, exponent + 1].flatMap(power =>
        STEP_FACTORS.flatMap(factor => {
            const step = Number((factor * 10 ** power).toPrecision(PRECISION));
            const intervals = Math.ceil(peak / step - EPSILON);

            return intervals >= MIN_INTERVALS && intervals <= MAX_INTERVALS
                ? [{ step, top: Number((step * intervals).toPrecision(PRECISION)) }]
                : [];
        })
    );
    const best = fits.reduce((tightest, fit) =>
        fit.top < tightest.top || (fit.top === tightest.top && fit.step > tightest.step) ? fit : tightest
    );

    return { top: best.top, bottom: -depthBelowZero, depth: depthBelowZero, step: best.step };
};
