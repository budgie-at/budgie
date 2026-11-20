import { expect, it } from '@effect/vitest';

import { formatYieldCompactAmount } from '../src/yield/utils/format-yield-compact-amount.util';
import { pickYieldCompactDivisor } from '../src/yield/utils/pick-yield-compact-divisor.util';

const formatNumber = (absolute: number, digits: number) => String(Number(absolute.toFixed(digits)));

it('uses one magnitude chosen from the largest value', () => {
    const divisor = pickYieldCompactDivisor(1_400_000, 1_000);

    expect(divisor).toBe(1_000_000);
    expect(formatYieldCompactAmount(1_400_000, divisor, '$', formatNumber)).toBe('$1.4M');
    expect(formatYieldCompactAmount(72_600, divisor, '$', formatNumber)).toBe('$0.07M');
});

it('does not compact below the threshold', () => {
    expect(pickYieldCompactDivisor(500, 1_000)).toBe(1);
    expect(formatYieldCompactAmount(73, 1, '$', formatNumber)).toBe('$73');
});

it('rolls over to the next unit when rounding reaches 1000', () => {
    expect(pickYieldCompactDivisor(999_800, 1_000)).toBe(1_000_000);
});
