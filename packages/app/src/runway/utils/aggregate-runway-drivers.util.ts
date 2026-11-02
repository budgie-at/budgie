import { RUNWAY_DRIVER_MIN_BURN_SHARE, RunwayDriverSeriesRowInterface } from '@budgie/contracts';

import { isEmptyArray, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { mean } from './mean.util';
import { spikeExcess } from './spike-excess.util';

import type { RunwayDriverBreakdownInterface } from '../interface/runway-driver-breakdown.interface';
import type { RunwaySeriesRowInterface } from '@budgie/contracts';

const NULL_DRIVER_KEY = -1;
const ONE_OFF_DRIVER_SHARE = 0.5;

export const aggregateRunwayDrivers = (
    rows: readonly RunwayDriverSeriesRowInterface[],
    series: readonly RunwaySeriesRowInterface[],
    isAllIn: boolean
): RunwayDriverBreakdownInterface => {
    const monthKeys = series.map(row => row.month);
    const monthIndexByKey = new Map(monthKeys.map((month, index) => [month, index]));
    const driverKeys = [...new Set(rows.map(row => row.id ?? NULL_DRIVER_KEY))];
    const driverEntries = driverKeys.map(driverKey => {
        const driverRows = rows.filter(row => (row.id ?? NULL_DRIVER_KEY) === driverKey);
        const firstRow = driverRows.at(0);
        const title = driverRows.reduce((currentTitle, row) => (isNotEmptyString(row.title) ? row.title : currentTitle), '');
        const monthlyAmounts = Array.from({ length: monthKeys.length }, () => 0);

        driverRows.forEach(row => {
            const monthIndex = monthIndexByKey.get(row.month);

            if (isDefined(monthIndex)) {
                monthlyAmounts[monthIndex] += row.amount;
            }
        });

        const oneOffAmounts = spikeExcess(monthlyAmounts);
        const averageAmount = mean(monthlyAmounts);
        const averageOneOffAmount = mean(oneOffAmounts);

        return {
            oneOffAmounts,
            driver: {
                id: isDefined(firstRow) ? firstRow.id : null,
                title,
                monthlyAmount: isAllIn ? averageAmount : averageAmount - averageOneOffAmount,
                isIrregular: isAllIn && isPositiveNumber(averageAmount) && averageOneOffAmount > averageAmount * ONE_OFF_DRIVER_SHARE,
                foldedDriverCount: 0
            }
        };
    });
    const drivers = driverEntries
        .map(entry => entry.driver)
        .filter(driver => isPositiveNumber(driver.monthlyAmount))
        .sort((left, right) => right.monthlyAmount - left.monthlyAmount);
    const irregularMonthlyAmounts = monthKeys.map((_, monthIndex) =>
        driverEntries.reduce((total, entry) => total + entry.oneOffAmounts[monthIndex], 0)
    );
    const minimumMonthlyAmount = mean(series.map(row => row.expense)) * RUNWAY_DRIVER_MIN_BURN_SHARE;
    const foldedDrivers = drivers.filter(driver => driver.monthlyAmount < minimumMonthlyAmount);

    if (isEmptyArray(foldedDrivers)) {
        return { drivers, irregularMonthlyAmounts };
    }

    return {
        drivers: [
            ...drivers.filter(driver => driver.monthlyAmount >= minimumMonthlyAmount),
            {
                id: null,
                title: '',
                monthlyAmount: foldedDrivers.reduce((total, driver) => total + driver.monthlyAmount, 0),
                isIrregular: false,
                foldedDriverCount: foldedDrivers.length
            }
        ],
        irregularMonthlyAmounts
    };
};
