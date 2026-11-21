import { expect, it } from '@effect/vitest';

import { roundYieldDifference } from '../src/yield/utils/round-yield-difference.util';

it('derives net from the rounded gross and rounded tax so displayed parts add up', () => {
    expect(roundYieldDifference(6193.6, 138.4, 0)).toBe(6194 - 138);
});

it('keeps decimal places', () => {
    expect(roundYieldDifference(10.126, 2.004, 2)).toBeCloseTo(8.13, 6);
});
