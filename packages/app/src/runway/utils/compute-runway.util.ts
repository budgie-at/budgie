import { isDefined } from '@rnw-community/shared';

import { RUNWAY_MINIMUM_MONTHS } from '../constant/runway-minimum-months.constant';

import { mean } from './mean.util';
import { spikeExcess } from './spike-excess.util';

import type { ComputeRunwayParams } from '../interface/compute-runway-params.interface';
import type { RunwayComputationInterface } from '../interface/runway-computation.interface';

const AVERAGE_DAYS_PER_MONTH = 30.4375;
const MILLISECONDS_PER_DAY = 86_400_000;
const MILLISECONDS_PER_MONTH = AVERAGE_DAYS_PER_MONTH * MILLISECONDS_PER_DAY;

const runsOutDate = (referenceDate: Date, months: number | null): Date | null =>
    isDefined(months) ? new Date(referenceDate.getTime() + months * MILLISECONDS_PER_MONTH) : null;

export const computeRunway = (params: ComputeRunwayParams): RunwayComputationInterface => {
    const { series, liquid, irregularMonthlyAmounts, isAllIn, referenceDate } = params;
    const rows = series.length < RUNWAY_MINIMUM_MONTHS ? [] : series;
    const incomes = rows.map(row => row.income);
    const oneOffIncomes = isAllIn ? [] : spikeExcess(incomes);
    const typicalIncomes = incomes.map((amount, index) => amount - (oneOffIncomes.at(index) ?? 0));
    const typicalExpenses = rows.map((row, index) => row.expense - (isAllIn ? 0 : (irregularMonthlyAmounts.at(index) ?? 0)));
    const burn = mean(typicalExpenses);
    const income = mean(typicalIncomes);
    const net = income - burn;
    const netSeries = typicalIncomes.map((amount, index) => amount - typicalExpenses[index]);
    const runwayMonths = net < 0 ? Math.max(liquid, 0) / Math.abs(net) : null;

    return {
        burn,
        income,
        net,
        liquid,
        runwayMonths,
        runsOutAt: runsOutDate(referenceDate, runwayMonths),
        netStandardDeviation:
            netSeries.length > 1
                ? Math.sqrt(netSeries.reduce((total, value) => total + (value - net) ** 2, 0) / (netSeries.length - 1))
                : 0,
        monthsUsed: series.length,
        isPositive: net >= 0
    };
};
