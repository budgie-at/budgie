import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

it.each([
    [1_200, 1_500, 500],
    [500, 500, 250],
    [11_000, 15_000, 5_000],
    [21_000, 30_000, 10_000],
    [4_800_000, 5_000_000, 2_500_000],
    [0.4, 0.4, 0.2],
    [100, 100, 50]
])('fits a peak of %d with a top of %d on a step of %d', (peak, top, step) => {
    expect(buildYieldAxis(peak, 0)).toMatchObject({ top, step });
});

it('never puts the top tick below the peak', () => {
    [1, 7, 9, 99, 100, 774, 1_289, 2_501, 12_110].forEach(peak => {
        expect(buildYieldAxis(peak, 0).top).toBeGreaterThanOrEqual(peak);
    });
});

it('keeps two to three intervals between zero and the top', () => {
    [1, 7, 9, 99, 774, 1_289, 2_501, 12_110, 88_000].forEach(peak => {
        const { top, step } = buildYieldAxis(peak, 0);

        expect(Math.round(top / step)).toBeGreaterThanOrEqual(2);
        expect(Math.round(top / step)).toBeLessThanOrEqual(3);
    });
});

it('reaches below zero exactly as deep as the tax', () => {
    expect(buildYieldAxis(100, 30).bottom).toBe(-30);
});

it.each([
    [0, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0]
])('falls back to a unit axis for (%d, %d)', (max, depth) => {
    expect(buildYieldAxis(max, depth)).toEqual({ top: 1, bottom: -depth, depth, step: 0.5 });
});
