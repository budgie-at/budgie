import { expect, it } from '@effect/vitest';

import { roundYieldParts } from '../src/yield/utils/round-yield-parts.util';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

it('makes the rounded parts add up to the rounded total', () => {
    const rounded = roundYieldParts([4_000.4, 3_500.4, 3_489.4], 10_990.2, 0);

    expect(sum(rounded)).toBe(10_990);
});

it('gives the extra unit to the largest remainders', () => {
    expect(roundYieldParts([0.6, 0.6, 0.6], 2, 0)).toEqual([1, 1, 0]);
});

it('works at cent precision', () => {
    const rounded = roundYieldParts([10.005, 20.005, 30.005], 60.02, 2);

    expect(Math.round(sum(rounded) * 100)).toBe(6_002);
});

it('keeps exact values untouched', () => {
    expect(roundYieldParts([100, 50, 25], 175, 0)).toEqual([100, 50, 25]);
});

it('returns an empty list for no parts', () => {
    expect(roundYieldParts([], 0, 0)).toEqual([]);
});
