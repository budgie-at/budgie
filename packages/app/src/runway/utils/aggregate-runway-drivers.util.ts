import { RUNWAY_IRREGULAR_CONCENTRATION_THRESHOLD, RUNWAY_IRREGULAR_CV_THRESHOLD, RunwayDriverSeriesRowInterface } from '@budgie/contracts';

import { isEmptyArray, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { RunwayDriverInterface } from '../interface/runway-driver.interface';

const NULL_DRIVER_KEY = -1;

const isIrregularDriver = (monthlyAmounts: readonly number[]): boolean => {
    if (isEmptyArray(monthlyAmounts)) {
        return false;
    }

    const total = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);

    if (!isPositiveNumber(total)) {
        return false;
    }

    const mean = total / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + (amount - mean) ** 2, 0) / monthlyAmounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const concentration = Math.max(...monthlyAmounts) / total;

    return coefficientOfVariation > RUNWAY_IRREGULAR_CV_THRESHOLD || concentration >= RUNWAY_IRREGULAR_CONCENTRATION_THRESHOLD;
};

export const aggregateRunwayDrivers = (rows: readonly RunwayDriverSeriesRowInterface[], months: number): RunwayDriverInterface[] => {
    const monthKeys = [...new Set(rows.map(row => row.month))].sort().slice(-months);
    const monthIndexByKey = new Map(monthKeys.map((month, index) => [month, index]));
    const driverKeys = [...new Set(rows.map(row => row.id ?? NULL_DRIVER_KEY))];

    return driverKeys
        .map(driverKey => {
            const driverRows = rows.filter(row => (row.id ?? NULL_DRIVER_KEY) === driverKey);
            const firstRow = driverRows.at(0);
            const title = driverRows.reduce((currentTitle, row) => (isNotEmptyString(row.title) ? row.title : currentTitle), '');
            const amount = driverRows.reduce((total, row) => total + row.amount, 0);
            const monthlyAmounts = Array.from({ length: months }, () => 0);

            driverRows.forEach(row => {
                const monthIndex = monthIndexByKey.get(row.month);

                if (isDefined(monthIndex)) {
                    monthlyAmounts[monthIndex] += row.amount;
                }
            });

            return {
                id: isDefined(firstRow) ? firstRow.id : null,
                title,
                amount,
                monthlyAmount: amount / months,
                monthlyAmounts,
                isIrregular: isIrregularDriver(monthlyAmounts)
            };
        })
        .sort((left, right) => right.amount - left.amount);
};
