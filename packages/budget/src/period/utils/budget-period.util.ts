import { BudgetPeriodEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { endOfMonth } from 'date-fns/endOfMonth';
import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { lastDayOfMonth } from 'date-fns/lastDayOfMonth';
import { setDate } from 'date-fns/setDate';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';

import type { BudgetPeriodSpecInterface } from '../interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../interface/budget-period-window.interface';

const WEEKLY_PERIOD_DAYS = 7;
const BIWEEKLY_PERIOD_DAYS = 14;
const FALLBACK_PERIOD_ANCHOR_YEAR = 2024;
const FALLBACK_PERIOD_ANCHOR = new Date(FALLBACK_PERIOD_ANCHOR_YEAR, 0, 1);

const buildMonthKey = (date: Date): string => `${getYear(date)}-${getMonth(date)}`;

const clampDayToMonth = (year: number, monthIndex: number, day: number): Date => {
    const lastDay = lastDayOfMonth(new Date(year, monthIndex, 1)).getDate();

    return startOfDay(new Date(year, monthIndex, Math.min(day, lastDay)));
};

const buildCountsByMonth = (operatedAtDates: readonly Date[]): Map<string, number> => {
    const countsByMonth = new Map<string, number>();

    for (const operatedAt of operatedAtDates) {
        const key = buildMonthKey(operatedAt);
        countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
    }

    return countsByMonth;
};

const computeEndOfMonthWindow = (now: Date): BudgetPeriodWindowInterface => {
    const currentMonthEnd = startOfDay(endOfMonth(now));

    if (now.getTime() >= currentMonthEnd.getTime()) {
        return { periodStart: currentMonthEnd, nextPeriodStart: startOfDay(endOfMonth(addMonths(now, 1))) };
    }

    return { periodStart: startOfDay(endOfMonth(subMonths(now, 1))), nextPeriodStart: currentMonthEnd };
};

const computeStartDayWindow = (periodStartDay: number, now: Date): BudgetPeriodWindowInterface => {
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const startThisMonth = clampDayToMonth(year, monthIndex, periodStartDay);

    if (now.getTime() >= startThisMonth.getTime()) {
        const nextMonthDate = addMonths(setDate(new Date(year, monthIndex, 1), 1), 1);

        return {
            periodStart: startThisMonth,
            nextPeriodStart: clampDayToMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), periodStartDay)
        };
    }

    const previousMonthDate = subMonths(setDate(new Date(year, monthIndex, 1), 1), 1);

    return {
        periodStart: clampDayToMonth(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), periodStartDay),
        nextPeriodStart: startThisMonth
    };
};

const computeMonthlyWindow = (periodStartDay: number, useLastDayOfMonth: boolean, now: Date): BudgetPeriodWindowInterface => {
    if (useLastDayOfMonth) {
        return computeEndOfMonthWindow(now);
    }

    return computeStartDayWindow(periodStartDay, now);
};

const computeAnchoredWindow = (anchorDate: Date, periodDays: number, now: Date): BudgetPeriodWindowInterface => {
    const anchorDay = startOfDay(anchorDate);
    const periodIndex = Math.floor(differenceInCalendarDays(now, anchorDay) / periodDays);
    const periodStart = addDays(anchorDay, periodIndex * periodDays);

    return { periodStart, nextPeriodStart: addDays(periodStart, periodDays) };
};

const computeYearlyWindow = (anchorDate: Date, now: Date): BudgetPeriodWindowInterface => {
    const anchorMonthIndex = anchorDate.getMonth();
    const anchorDayOfMonth = anchorDate.getDate();
    const startThisYear = clampDayToMonth(now.getFullYear(), anchorMonthIndex, anchorDayOfMonth);
    const startYear = now.getTime() >= startThisYear.getTime() ? now.getFullYear() : now.getFullYear() - 1;

    return {
        periodStart: clampDayToMonth(startYear, anchorMonthIndex, anchorDayOfMonth),
        nextPeriodStart: clampDayToMonth(startYear + 1, anchorMonthIndex, anchorDayOfMonth)
    };
};

export const computePeriodWindow = (spec: BudgetPeriodSpecInterface, now: Date): BudgetPeriodWindowInterface => {
    const anchorDate = spec.periodAnchorDate ?? FALLBACK_PERIOD_ANCHOR;

    if (spec.period === BudgetPeriodEnum.WEEKLY) {
        return computeAnchoredWindow(anchorDate, WEEKLY_PERIOD_DAYS, now);
    }

    if (spec.period === BudgetPeriodEnum.BIWEEKLY) {
        return computeAnchoredWindow(anchorDate, BIWEEKLY_PERIOD_DAYS, now);
    }

    if (spec.period === BudgetPeriodEnum.YEARLY) {
        return computeYearlyWindow(anchorDate, now);
    }

    return computeMonthlyWindow(spec.periodStartDay, spec.useLastDayOfMonth, now);
};

export const getInclusiveEnd = (nextPeriodStart: Date): Date => new Date(nextPeriodStart.getTime() - 1);

export const computeTrailingMonthsWindow = (now: Date, months: number): { readonly start: Date; readonly end: Date } => ({
    start: startOfMonth(subMonths(now, months)),
    end: startOfMonth(now)
});

export const resolveSuggestedWindowMonths = (
    operatedAtDates: readonly Date[],
    windowStart: Date,
    maxMonths: number,
    minEntriesPerMonth: number
): number => {
    const countsByMonth = buildCountsByMonth(operatedAtDates);
    let months = 0;

    for (let offset = maxMonths - 1; offset >= 0; offset -= 1) {
        const count = countsByMonth.get(buildMonthKey(addMonths(windowStart, offset))) ?? 0;

        if (count < minEntriesPerMonth) {
            break;
        }

        months += 1;
    }

    return months;
};
