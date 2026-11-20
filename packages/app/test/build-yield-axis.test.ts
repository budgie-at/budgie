import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

it('rounds the top up to a round number with headroom above the peak', () => {
    expect(buildYieldAxis(100, 0).top).toBe(150);
    expect(buildYieldAxis(1_200, 0).top).toBe(1_500);
    expect(buildYieldAxis(4_800_000, 0).top).toBe(6_000_000);
});

it('always leaves room above the peak', () => {
    [1, 7, 99, 100, 1_289, 12_110].forEach(peak => {
        expect(buildYieldAxis(peak, 0).top).toBeGreaterThan(peak);
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
    expect(buildYieldAxis(max, depth)).toEqual({ top: 1, bottom: -depth });
});
