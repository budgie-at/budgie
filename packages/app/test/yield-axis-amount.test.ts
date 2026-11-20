import { expect, it } from '@effect/vitest';

import { formatYieldAxisAmount } from '../src/yield/utils/format-yield-axis-amount.util';

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
