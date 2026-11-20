import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

it('snaps the top to 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(buildYieldAxis(100, 0).top).toBe(100);
    expect(buildYieldAxis(11_000, 0).top).toBe(20_000);
    expect(buildYieldAxis(21_000, 0).top).toBe(25_000);
    expect(buildYieldAxis(4_800_000, 0).top).toBe(5_000_000);
    expect(buildYieldAxis(0.4, 0).top).toBe(0.5);
});

it('never puts the top tick below the peak', () => {
    [1, 7, 99, 100, 1_289, 12_110, 774, 2_501].forEach(peak => {
        expect(buildYieldAxis(peak, 0).top).toBeGreaterThanOrEqual(peak);
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
    expect(buildYieldAxis(max, depth)).toEqual({ top: 1, bottom: -depth, depth });
});
