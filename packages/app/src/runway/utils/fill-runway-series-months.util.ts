import { isDefined } from '@rnw-community/shared';

import type { RunwaySeriesRowInterface } from '@budgie/contracts';

const formatMonth = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const fillRunwaySeriesMonths = (series: readonly RunwaySeriesRowInterface[], referenceDate: Date): RunwaySeriesRowInterface[] => {
    const firstRow = series.at(0);

    if (!isDefined(firstRow)) {
        return [];
    }

    const [firstYear, firstMonth] = firstRow.month.split('-').map(Number);
    const rowByMonth = new Map(series.map(row => [row.month, row]));
    const monthCount = (referenceDate.getFullYear() - firstYear) * 12 + referenceDate.getMonth() - (firstMonth - 1);

    return Array.from({ length: Math.max(monthCount, 0) }, (_, offset) => {
        const month = formatMonth(new Date(firstYear, firstMonth - 1 + offset, 1));

        return rowByMonth.get(month) ?? { month, income: 0, expense: 0 };
    });
};
