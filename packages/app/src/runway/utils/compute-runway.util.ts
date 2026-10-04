import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { RUNWAY_MINIMUM_MONTHS } from '../constant/runway-minimum-months.constant';

import { median } from './median.util';
import { percentile } from './percentile.util';

import type { ComputeRunwayParams } from '../interface/compute-runway-params.interface';
import type { RunwayComputationInterface } from '../interface/runway-computation.interface';

const P25_PERCENTILE = 0.25;
const P75_PERCENTILE = 0.75;
const AVERAGE_DAYS_PER_MONTH = 30.4375;
const MILLISECONDS_PER_DAY = 86_400_000;
const MILLISECONDS_PER_MONTH = AVERAGE_DAYS_PER_MONTH * MILLISECONDS_PER_DAY;

const runsOutDate = (referenceDate: Date, months: number | null): Date | null =>
    isDefined(months) ? new Date(referenceDate.getTime() + months * MILLISECONDS_PER_MONTH) : null;

export const computeRunway = (params: ComputeRunwayParams): RunwayComputationInterface => {
    const { series, liquid, irregularMonthlyAmount, isAllIn, referenceDate } = params;
    const rows = series.length < RUNWAY_MINIMUM_MONTHS ? [] : series;
    const burn = median(rows.map(row => row.expense)) + (isAllIn && isNotEmptyArray(rows) ? irregularMonthlyAmount : 0);
    const income = median(rows.map(row => row.income));
    const net = income - burn;
    const netSeries = rows.map(row => row.income - row.expense);
    const runwayMonths = net < 0 ? liquid / Math.abs(net) : null;

    return {
        burn,
        income,
        net,
        liquid,
        runwayMonths,
        runsOutAt: runsOutDate(referenceDate, runwayMonths),
        p25Net: percentile(netSeries, P25_PERCENTILE),
        p75Net: percentile(netSeries, P75_PERCENTILE),
        monthsUsed: series.length,
        isPositive: net >= 0
    };
};
