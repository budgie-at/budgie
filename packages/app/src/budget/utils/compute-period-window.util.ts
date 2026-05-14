import { addMonths, endOfMonth, lastDayOfMonth, setDate, startOfDay, subMonths } from 'date-fns';

interface PeriodWindow {
    readonly periodStart: Date;
    readonly nextPeriodStart: Date;
}

const clampDayToMonth = (year: number, monthIndex: number, day: number): Date => {
    const lastDay = lastDayOfMonth(new Date(year, monthIndex, 1)).getDate();
    const clampedDay = Math.min(day, lastDay);

    return startOfDay(new Date(year, monthIndex, clampedDay));
};

const computeEndOfMonthWindow = (now: Date): PeriodWindow => {
    const currentMonthEnd = startOfDay(endOfMonth(now));

    if (now.getTime() >= currentMonthEnd.getTime()) {
        return { periodStart: currentMonthEnd, nextPeriodStart: startOfDay(endOfMonth(addMonths(now, 1))) };
    }

    return { periodStart: startOfDay(endOfMonth(subMonths(now, 1))), nextPeriodStart: currentMonthEnd };
};

const computeStartDayWindow = (periodStartDay: number, now: Date): PeriodWindow => {
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

export const computePeriodWindow = (periodStartDay: number, useLastDayOfMonth: boolean, now: Date): PeriodWindow =>
    useLastDayOfMonth ? computeEndOfMonthWindow(now) : computeStartDayWindow(periodStartDay, now);
