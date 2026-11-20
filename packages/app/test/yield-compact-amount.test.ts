import { expect, it } from '@effect/vitest';

import { formatYieldCompactAmount } from '../src/yield/utils/format-yield-compact-amount.util';
import { pickYieldCompactDivisor } from '../src/yield/utils/pick-yield-compact-divisor.util';

const formatNumber = (absolute: number, digits: number) => absolute.toFixed(digits);

it('formats every value with three significant digits and its own magnitude', () => {
    expect(formatYieldCompactAmount(4_110_000, '$', formatNumber)).toBe('$4.11M');
    expect(formatYieldCompactAmount(2_700_000, '$', formatNumber)).toBe('$2.70M');
    expect(formatYieldCompactAmount(-282_000, '$', formatNumber)).toBe('−$282K');
    expect(formatYieldCompactAmount(72_600, '$', formatNumber)).toBe('$72.6K');
    expect(formatYieldCompactAmount(1_250, '$', formatNumber)).toBe('$1.25K');
});

it('never shows a leading zero magnitude', () => {
    expect(formatYieldCompactAmount(500, '$', formatNumber)).toBe('$500');
    expect(formatYieldCompactAmount(280_000, '$', formatNumber)).toBe('$280K');
    expect(formatYieldCompactAmount(0, '$', formatNumber)).toBe('$0');
});

it('keeps cents on tiny values', () => {
    expect(formatYieldCompactAmount(2.5, '$', formatNumber)).toBe('$2.50');
});

it('does not pick a unit below the threshold', () => {
    expect(pickYieldCompactDivisor(500, 1_000)).toBe(1);
});

it('rolls over to the next unit when rounding reaches 1000', () => {
    expect(pickYieldCompactDivisor(999_800, 1_000)).toBe(1_000_000);
    expect(formatYieldCompactAmount(999_800, '$', formatNumber)).toBe('$1.00M');
});
