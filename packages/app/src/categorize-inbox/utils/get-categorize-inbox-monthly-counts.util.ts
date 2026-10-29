import { isSameMonth, startOfMonth, subMonths } from 'date-fns';

import { isEmptyArray } from '@rnw-community/shared';

import type { CategorizeInboxMonthlyBucketInterface } from '../interface/categorize-inbox-monthly-bucket.interface';
import type { CategorizeInboxRowInterface } from '@budgie/categorization';

const MONTH_BUCKET_COUNT = 12;

export const getCategorizeInboxMonthlyCounts = (
    rows: readonly Pick<CategorizeInboxRowInterface, 'operatedAt'>[]
): CategorizeInboxMonthlyBucketInterface[] => {
    if (isEmptyArray(rows)) {
        return [];
    }

    const newestMonth = startOfMonth(new Date(Math.max(...rows.map(row => row.operatedAt.getTime()))));

    return Array.from({ length: MONTH_BUCKET_COUNT }, (_, index) => {
        const month = subMonths(newestMonth, MONTH_BUCKET_COUNT - 1 - index);

        return { month, count: rows.filter(row => isSameMonth(row.operatedAt, month)).length };
    });
};
