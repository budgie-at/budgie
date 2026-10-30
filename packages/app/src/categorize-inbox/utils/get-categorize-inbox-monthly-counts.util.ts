import { differenceInCalendarMonths, isSameMonth, startOfMonth, subMonths } from 'date-fns';

import { isEmptyArray } from '@rnw-community/shared';

import type { CategorizeInboxMonthlyBucketInterface } from '../interface/categorize-inbox-monthly-bucket.interface';
import type { CategorizeInboxRowInterface } from '@budgie/categorization';

const MIN_MONTH_BUCKET_COUNT = 6;

export const getCategorizeInboxMonthlyCounts = (
    rows: readonly Pick<CategorizeInboxRowInterface, 'operatedAt'>[]
): CategorizeInboxMonthlyBucketInterface[] => {
    if (isEmptyArray(rows)) {
        return [];
    }

    const timestamps = rows.map(row => row.operatedAt.getTime());
    const currentMonth = startOfMonth(new Date());
    const newestRowMonth = startOfMonth(new Date(Math.max(...timestamps)));
    const lastMonth = newestRowMonth > currentMonth ? newestRowMonth : currentMonth;
    const firstMonth = startOfMonth(new Date(Math.min(...timestamps)));
    const bucketCount = Math.max(MIN_MONTH_BUCKET_COUNT, differenceInCalendarMonths(lastMonth, firstMonth) + 1);

    return Array.from({ length: bucketCount }, (_, index) => {
        const month = subMonths(lastMonth, bucketCount - 1 - index);

        return { month, count: rows.filter(row => isSameMonth(row.operatedAt, month)).length };
    });
};
