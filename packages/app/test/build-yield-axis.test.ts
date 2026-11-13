import { expect, it } from '@effect/vitest';

import { buildYieldAxis } from '../src/yield/utils/build-yield-axis.util';

it.each([
    [612, 0, { step: 500, top: 1000, bottom: 0, gridlines: [0, 500, 1000] }],
    [38, 0, { step: 20, top: 40, bottom: 0, gridlines: [0, 20, 40] }],
    [50, 0, { step: 25, top: 50, bottom: 0, gridlines: [0, 25, 50] }],
    [100, -12, { step: 100, top: 100, bottom: -100, gridlines: [-100, 0, 100] }],
    [0, 0, { step: 1, top: 1, bottom: 0, gridlines: [0, 1] }]
])('steps (%d, %d) at a nice value with zero on a gridline', (max, min, expected) => {
    expect(buildYieldAxis(max, min)).toEqual(expected);
});

it('survives tiny values without gridline drift', () => {
    const axis = buildYieldAxis(0.0003, 0);

    expect(axis.step).toBeCloseTo(0.0002, 12);
    expect(axis.top).toBeCloseTo(0.0004, 12);
    expect(axis.gridlines).toHaveLength(3);
});

it('handles huge values', () => {
    expect(buildYieldAxis(1e12, 0)).toEqual({ step: 5e11, top: 1e12, bottom: 0, gridlines: [0, 5e11, 1e12] });
});

it('extends below zero when tax exceeds earned', () => {
    expect(buildYieldAxis(10, -50)).toEqual({ step: 50, top: 50, bottom: -50, gridlines: [-50, 0, 50] });
});

it.each([
    [Number.NaN, 0],
    [10, Number.NaN],
    [Number.POSITIVE_INFINITY, 0],
    [0, Number.NEGATIVE_INFINITY]
])('falls back to the empty axis for (%d, %d)', (max, min) => {
    expect(buildYieldAxis(max, min)).toEqual({ step: 1, top: 1, bottom: 0, gridlines: [0, 1] });
});
