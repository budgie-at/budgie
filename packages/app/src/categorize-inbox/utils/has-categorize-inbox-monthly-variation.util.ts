import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { getCategorizeInboxMonthlyCounts } from './get-categorize-inbox-monthly-counts.util';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

const MIN_CHART_PAYMENT_COUNT = 4;
const STEADY_MONTH_RATIO = 0.85;

export const hasCategorizeInboxMonthlyVariation = (rows: readonly Pick<CategorizeInboxRowInterface, 'operatedAt'>[]): boolean => {
    if (rows.length < MIN_CHART_PAYMENT_COUNT) {
        return false;
    }

    const buckets = getCategorizeInboxMonthlyCounts(rows);
    const counts = buckets
        .slice(
            Math.max(
                0,
                buckets.findIndex(bucket => isPositiveNumber(bucket.count))
            )
        )
        .map(bucket => bucket.count);

    if (isEmptyArray(counts)) {
        return false;
    }

    return Math.min(...counts) <= STEADY_MONTH_RATIO * Math.max(...counts);
};
