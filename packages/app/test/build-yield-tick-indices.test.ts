import { YieldBucketUnitEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { buildYieldTickIndices } from '../src/yield/utils/build-yield-tick-indices.util';

const months = (firstYear: number, firstMonth: number, count: number) =>
    Array.from({ length: count }, (_, offset) => {
        const absolute = firstMonth - 1 + offset;
        const month = String((absolute % 12) + 1).padStart(2, '0');

        return { start: `${firstYear + Math.floor(absolute / 12)}-${month}-01`, total: 0 };
    });

it('aligns long monthly ranges to January and July', () => {
    const buckets = months(2025, 1, 20);

    expect(buildYieldTickIndices(buckets, YieldBucketUnitEnum.MONTH, 10, 4).indices).toEqual([0, 6, 12, 18]);
});

it('keeps even spacing for a single year of months', () => {
    const buckets = months(2025, 12, 12);

    expect(buildYieldTickIndices(buckets, YieldBucketUnitEnum.MONTH, 10, 4).indices).toEqual([2, 5, 8, 11]);
});
