import { expect, it } from '@effect/vitest';

import { formatYieldAxisAmount } from '../src/yield/utils/format-yield-axis-amount.util';
import { formatYieldCompactAmount } from '../src/yield/utils/format-yield-compact-amount.util';
import { pickYieldCompactDivisor } from '../src/yield/utils/pick-yield-compact-divisor.util';

const formatNumber = (absolute: number, digits: number) => absolute.toFixed(digits);

it.each([
    [500, '$500'],
    [1_000, '$1K'],
    [1_500, '$1.5K'],
    [2_000, '$2K'],
    [20_000, '$20K'],
    [1_500_000, '$1.5M'],
    [2.5, '$2.5'],
    [250, '$250']
])('formats the axis tick %d as the shortest exact form %s', (value, expected) => {
    expect(formatYieldAxisAmount(value, '$', formatNumber)).toBe(expected);
});

it.each([
    [4_110_000, '$4.11M'],
    [2_700_000, '$2.70M'],
    [-282_000, '−$282K'],
    [72_600, '$72.6K'],
    [1_250, '$1.25K'],
    [500, '$500'],
    [280_000, '$280K'],
    [0, '$0'],
    [2.5, '$2.50'],
    [999_800, '$1.00M']
])('formats the compact amount %d as %s', (value, expected) => {
    expect(formatYieldCompactAmount(value, '$', formatNumber)).toBe(expected);
});

it('does not pick a unit below the threshold', () => {
    expect(pickYieldCompactDivisor(500, 1_000)).toBe(1);
});

it('rolls over to the next unit when rounding reaches 1000', () => {
    expect(pickYieldCompactDivisor(999_800, 1_000)).toBe(1_000_000);
});
