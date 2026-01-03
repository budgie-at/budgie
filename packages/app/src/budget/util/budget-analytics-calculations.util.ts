import { BudgetEntityInterface } from '@budgie/contracts';

import { formatMonthYear } from './format-month-year.util';

interface HistoricalPeriod {
    label: string;
    startDate: Date;
    endDate: Date;
}

interface PeriodDates {
    startDate: Date;
    endDate: Date;
}

const HISTORICAL_PERIODS_COUNT = 3;

export const calculatePeriodDates = (budget: BudgetEntityInterface): PeriodDates => {
    const now = new Date();
    const { startDay } = budget;
    const year = now.getFullYear();
    const month = now.getMonth();

    let startDate = new Date(year, month, startDay);
    if (startDate > now) {
        startDate = new Date(year, month - 1, startDay);
    }

    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

    return { startDate, endDate };
};

export const calculateHistoricalPeriods = (budget: BudgetEntityInterface, periodDates: PeriodDates): HistoricalPeriod[] => {
    const { startDay } = budget;
    const periods: HistoricalPeriod[] = [];

    for (let idx = 1; idx <= HISTORICAL_PERIODS_COUNT; idx += 1) {
        const currentStart = periodDates.startDate;
        const startDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - idx, startDay);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);
        const label = formatMonthYear(startDate);

        periods.push({ label, startDate, endDate });
    }

    return periods;
};

