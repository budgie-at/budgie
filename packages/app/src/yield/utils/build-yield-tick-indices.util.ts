import { YieldBucketUnitEnum } from '@budgie/market';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { YieldBucketInterface } from '@budgie/market';

const CALENDAR_MONTH_STEPS = [6, 12, 24, 48] as const;
const MONTH_SLICE_START = 5;
const MONTH_SLICE_END = 7;
const MIN_CALENDAR_TICKS = 2;
const MONTHS_PER_YEAR = 12;

const MAX_SPARSE_BUCKETS = 6;
const MONTH_SPACING = 28;
const DAY_SPACING = 44;

export const buildYieldTickIndices = (
    buckets: readonly Pick<YieldBucketInterface, 'total' | 'start'>[],
    unit: YieldBucketUnitEnum,
    slot: number,
    maxTicks: number
) => {
    const funded = buckets.flatMap((bucket, index) => (bucket.total > 0 ? [index] : []));
    const isSparse = isNotEmptyArray(funded) && funded.length <= MAX_SPARSE_BUCKETS;

    if (isSparse) {
        const spacing = unit === YieldBucketUnitEnum.MONTH ? MONTH_SPACING : DAY_SPACING;

        return funded.filter((index, order) => order === 0 || (index - (funded.at(order - 1) ?? index)) * slot >= spacing);
    }

    if (unit === YieldBucketUnitEnum.MONTH && buckets.length > MONTHS_PER_YEAR) {
        const calendarIndices = CALENDAR_MONTH_STEPS.map(months =>
            buckets.flatMap((bucket, index) =>
                (Number(bucket.start.slice(MONTH_SLICE_START, MONTH_SLICE_END)) - 1) % months === 0 ? [index] : []
            )
        ).find(candidate => candidate.length >= MIN_CALENDAR_TICKS && candidate.length <= maxTicks);

        if (isNotEmptyArray(calendarIndices)) {
            return calendarIndices;
        }
    }

    const step = Math.max(Math.ceil(buckets.length / maxTicks), 1);
    const lastIndex = buckets.length - 1;

    return Array.from({ length: Math.floor(lastIndex / step) + 1 }, (_, order) => lastIndex - order * step).reverse();
};
