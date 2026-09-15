import { isDefined, isEmptyArray } from '@rnw-community/shared';

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
    const { series, liquid, irregularMonthlyAmount, referenceDate } = params;
    const rows = series.length < RUNWAY_MINIMUM_MONTHS ? [] : series;
    const burn = median(rows.map(row => row.expense));
    const income = median(rows.map(row => row.income));
    const net = income - burn;
    const netSeries = rows.map(row => row.income - row.expense);
    const runwayMonths = net < 0 ? liquid / Math.abs(net) : null;
    const allInBurn = burn + (isEmptyArray(rows) ? 0 : irregularMonthlyAmount);
    const allInNet = income - allInBurn;
    const allInRunwayMonths = allInNet < 0 ? liquid / Math.abs(allInNet) : null;

    return {
        burn,
        income,
        net,
        allInBurn,
        allInNet,
        liquid,
        runwayMonths,
        allInRunwayMonths,
        allInRunsOutAt: runsOutDate(referenceDate, allInRunwayMonths),
        runsOutAt: runsOutDate(referenceDate, runwayMonths),
        p25Net: percentile(netSeries, P25_PERCENTILE),
        p75Net: percentile(netSeries, P75_PERCENTILE),
        monthsUsed: series.length,
        isPositive: net >= 0
    };
};
