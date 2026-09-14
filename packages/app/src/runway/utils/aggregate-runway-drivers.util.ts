import {
    RUNWAY_DRIVER_MIN_BURN_SHARE,
    RUNWAY_IRREGULAR_CONCENTRATION_THRESHOLD,
    RUNWAY_IRREGULAR_CV_THRESHOLD,
    RunwayDriverSeriesRowInterface
} from '@budgie/contracts';

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

export const aggregateRunwayDrivers = (rows: readonly RunwayDriverSeriesRowInterface[], monthlyBurn: number): RunwayDriverInterface[] => {
    const monthKeys = [...new Set(rows.map(row => row.month))].sort();
    const monthIndexByKey = new Map(monthKeys.map((month, index) => [month, index]));
    const driverKeys = [...new Set(rows.map(row => row.id ?? NULL_DRIVER_KEY))];
    const drivers = driverKeys
        .map(driverKey => {
            const driverRows = rows.filter(row => (row.id ?? NULL_DRIVER_KEY) === driverKey);
            const firstRow = driverRows.at(0);
            const title = driverRows.reduce((currentTitle, row) => (isNotEmptyString(row.title) ? row.title : currentTitle), '');
            const amount = driverRows.reduce((total, row) => total + row.amount, 0);
            const monthlyAmounts = Array.from({ length: monthKeys.length }, () => 0);

            driverRows.forEach(row => {
                const monthIndex = monthIndexByKey.get(row.month);

                if (isDefined(monthIndex)) {
                    monthlyAmounts[monthIndex] += row.amount;
                }
            });

            return {
                id: isDefined(firstRow) ? firstRow.id : null,
                title,
                monthlyAmount: amount / monthKeys.length,
                isIrregular: isIrregularDriver(monthlyAmounts),
                foldedDriverCount: 0
            };
        })
        .sort((left, right) => right.monthlyAmount - left.monthlyAmount);
    const minimumMonthlyAmount = monthlyBurn * RUNWAY_DRIVER_MIN_BURN_SHARE;
    const foldedDrivers = drivers.filter(driver => driver.monthlyAmount < minimumMonthlyAmount);

    if (isEmptyArray(foldedDrivers)) {
        return drivers;
    }

    return [
        ...drivers.filter(driver => driver.monthlyAmount >= minimumMonthlyAmount),
        {
            id: null,
            title: '',
            monthlyAmount: foldedDrivers.reduce((total, driver) => total + driver.monthlyAmount, 0),
            isIrregular: false,
            foldedDriverCount: foldedDrivers.length
        }
    ];
};
