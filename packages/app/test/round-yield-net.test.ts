import { expect, it } from '@effect/vitest';

import { roundYieldNet } from '../src/yield/utils/round-yield-net.util';

it('derives net from the rounded gross and rounded tax so displayed parts add up', () => {
    expect(roundYieldNet(6193.6, 138.4, 0)).toBe(6194 - 138);
});

it('keeps decimal places', () => {
    expect(roundYieldNet(10.126, 2.004, 2)).toBeCloseTo(8.13, 6);
});
