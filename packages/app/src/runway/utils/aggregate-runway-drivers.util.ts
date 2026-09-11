import { RUNWAY_IRREGULAR_CONCENTRATION_THRESHOLD, RUNWAY_IRREGULAR_CV_THRESHOLD, RunwayDriverSeriesRowInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { isIrregularDriver } from './is-irregular-driver.util';

import type { RunwayDriverInterface } from '../interface/runway-driver.interface';

const NULL_DRIVER_KEY = -1;

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
                isIrregular: isIrregularDriver(monthlyAmounts, RUNWAY_IRREGULAR_CV_THRESHOLD, RUNWAY_IRREGULAR_CONCENTRATION_THRESHOLD)
            };
        })
        .sort((left, right) => right.amount - left.amount);
};
