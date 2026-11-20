import { YieldBucketUnitEnum } from '@budgie/market';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { YieldBucketInterface } from '@budgie/market';

const MAX_SPARSE_BUCKETS = 6;
const MONTH_SPACING = 28;
const DAY_SPACING = 44;

export const buildYieldTickIndices = (
    buckets: readonly Pick<YieldBucketInterface, 'total'>[],
    unit: YieldBucketUnitEnum,
    slot: number,
    maxTicks: number
) => {
    const funded = buckets.flatMap((bucket, index) => (bucket.total > 0 ? [index] : []));
    const isSparse = isNotEmptyArray(funded) && funded.length <= MAX_SPARSE_BUCKETS;

    if (isSparse) {
        const spacing = unit === YieldBucketUnitEnum.MONTH ? MONTH_SPACING : DAY_SPACING;
        const indices = funded.filter((index, order) => order === 0 || (index - (funded.at(order - 1) ?? index)) * slot >= spacing);

        return { indices, isSparse };
    }

    const step = Math.max(Math.ceil(buckets.length / maxTicks), 1);
    const lastIndex = buckets.length - 1;
    const indices = Array.from({ length: Math.floor(lastIndex / step) + 1 }, (_, order) => lastIndex - order * step).reverse();

    return { indices, isSparse };
};
