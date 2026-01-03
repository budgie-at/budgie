import { BudgetEntityInterface } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { MS_PER_DAY } from '../constant/ms-per-day.constant';

import { formatMonthYear } from './format-month-year.util';

export interface HistoricalPeriodInterface {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
}

export interface PeriodDatesInterface {
    readonly startDate: Date;
    readonly endDate: Date;
}

export interface PeriodInfoInterface {
    readonly daysElapsed: number;
    readonly totalDays: number;
    readonly daysRemaining: number;
    readonly progressPercent: number;
}

const HISTORICAL_PERIODS_COUNT = 3;

export const calculatePeriodInfo = (periodDates: PeriodDatesInterface, now: Date): PeriodInfoInterface => {
    const nowTime = now.getTime();
    const daysElapsed = Math.floor((nowTime - periodDates.startDate.getTime()) / MS_PER_DAY);
    const totalDays = Math.floor((periodDates.endDate.getTime() - periodDates.startDate.getTime()) / MS_PER_DAY);
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercent = isPositiveNumber(totalDays) ? Math.round((daysElapsed / totalDays) * 100) : 0;

    return { daysElapsed, totalDays, daysRemaining, progressPercent };
};

export const calculatePeriodDates = (budget: BudgetEntityInterface): PeriodDatesInterface => {
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

export const calculateHistoricalPeriods = (budget: BudgetEntityInterface, periodDates: PeriodDatesInterface): HistoricalPeriodInterface[] => {
    const { startDay } = budget;
    const periods: HistoricalPeriodInterface[] = [];

    for (let idx = 1; idx <= HISTORICAL_PERIODS_COUNT; idx += 1) {
        const currentStart = periodDates.startDate;
        const startDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - idx, startDay);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);
        const label = formatMonthYear(startDate);

        periods.push({ label, startDate, endDate });
    }

    return periods;
};

