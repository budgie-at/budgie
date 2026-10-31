import { format, startOfMonth } from 'date-fns';

import type { CategorizeInboxMonthGroupInterface } from '../interface/categorize-inbox-month-group.interface';
import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export const groupCategorizeInboxRowsByMonth = (rows: readonly CategorizeInboxRowInterface[]): CategorizeInboxMonthGroupInterface[] => {
    const rowsByMonth = new Map<string, CategorizeInboxRowInterface[]>();
    const sortedRows = [...rows].sort((left, right) => right.operatedAt.getTime() - left.operatedAt.getTime());

    for (const row of sortedRows) {
        const monthKey = format(row.operatedAt, 'yyyy-MM');

        rowsByMonth.set(monthKey, [...(rowsByMonth.get(monthKey) ?? []), row]);
    }

    return [...rowsByMonth.values()].map(monthRows => ({ month: startOfMonth(monthRows[0].operatedAt), rows: monthRows }));
};
