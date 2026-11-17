import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

const HEIGHT = 200;
const LABEL_HEADROOM = 20;

const peakY = (peak: number, top: number, bottom: number) =>
    (top * HEIGHT) / (top - bottom) - (peak / top) * ((top * HEIGHT) / (top - bottom));

it('leaves room for the peak label above the highest bar', () => {
    const axis = buildYieldAxis(4_800_000, 0, HEIGHT);

    expect(axis.bottom).toBe(-0);
    expect(peakY(4_800_000, axis.top, axis.bottom)).toBeCloseTo(LABEL_HEADROOM, 9);
});

it('reaches below zero exactly as deep as the tax and keeps the peak headroom', () => {
    const axis = buildYieldAxis(100, 30, HEIGHT);

    expect(axis.bottom).toBe(-30);
    expect(peakY(100, axis.top, axis.bottom)).toBeCloseTo(LABEL_HEADROOM, 9);
});

it.each([
    [0, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0]
])('falls back to a unit axis for (%d, %d)', (max, depth) => {
    expect(buildYieldAxis(max, depth, HEIGHT)).toEqual({ top: 1, bottom: -depth });
});
