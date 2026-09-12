import { isEmptyArray, isDefined } from '@rnw-community/shared';

import { RUNWAY_MINIMUM_MONTHS } from '../constant/runway-minimum-months.constant';

import type { ComputeRunwayParams } from '../interface/compute-runway-params.interface';
import type { RunwayComputationInterface } from '../interface/runway-computation.interface';

const P25_PERCENTILE = 0.25;
const P75_PERCENTILE = 0.75;
const AVERAGE_DAYS_PER_MONTH = 30.4375;
const MILLISECONDS_PER_DAY = 86_400_000;
const MILLISECONDS_PER_MONTH = AVERAGE_DAYS_PER_MONTH * MILLISECONDS_PER_DAY;

const median = (values: readonly number[]): number => {
    if (isEmptyArray(values)) {
        return 0;
    }

    const sortedValues = [...values].sort((left, right) => left - right);
    const middleIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0) {
        return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    }

    return sortedValues[middleIndex];
};

const percentile = (values: readonly number[], percentileRank: number): number => {
    if (isEmptyArray(values)) {
        return 0;
    }

    const sortedValues = [...values].sort((left, right) => left - right);
    const clampedRank = Math.min(1, Math.max(0, percentileRank));
    const position = clampedRank * (sortedValues.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (lowerIndex === upperIndex) {
        return sortedValues[lowerIndex];
    }

    const weight = position - lowerIndex;

    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
};

export const computeRunway = (params: ComputeRunwayParams): RunwayComputationInterface => {
    const { series, liquid, irregularMonthlyAmount, referenceDate } = params;

    if (series.length < RUNWAY_MINIMUM_MONTHS) {
        return {
            burn: 0,
            income: 0,
            net: 0,
            allInNet: 0,
            liquid,
            runwayMonths: null,
            allInRunwayMonths: null,
            allInRunsOutAt: null,
            runsOutAt: null,
            p25Net: 0,
            p75Net: 0,
            monthsUsed: series.length,
            isPositive: true
        };
    }

    const burn = median(series.map(row => row.expense));
    const income = median(series.map(row => row.income));
    const net = income - burn;
    const netSeries = series.map(row => row.income - row.expense);
    const p25Net = percentile(netSeries, P25_PERCENTILE);
    const p75Net = percentile(netSeries, P75_PERCENTILE);
    const runwayMonths = net < 0 ? liquid / Math.abs(net) : null;
    const allInNet = net - irregularMonthlyAmount;
    const allInRunwayMonths = allInNet < 0 ? liquid / Math.abs(allInNet) : null;
    const runsOutAt = isDefined(runwayMonths) ? new Date(referenceDate.getTime() + runwayMonths * MILLISECONDS_PER_MONTH) : null;
    const allInRunsOutAt = isDefined(allInRunwayMonths)
        ? new Date(referenceDate.getTime() + allInRunwayMonths * MILLISECONDS_PER_MONTH)
        : null;

    return {
        burn,
        income,
        net,
        allInNet,
        liquid,
        runwayMonths,
        allInRunwayMonths,
        allInRunsOutAt,
        runsOutAt,
        p25Net,
        p75Net,
        monthsUsed: series.length,
        isPositive: net >= 0
    };
};
