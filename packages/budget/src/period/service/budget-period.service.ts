import { Log } from '@budgie/logger';
import { addMonths } from 'date-fns/addMonths';
import { endOfMonth } from 'date-fns/endOfMonth';
import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { lastDayOfMonth } from 'date-fns/lastDayOfMonth';
import { setDate } from 'date-fns/setDate';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

class BudgetPeriodService {
    @Log(
        (periodStartDay, useLastDayOfMonth, now) =>
            `enter periodStartDay=${periodStartDay} useLastDayOfMonth=${useLastDayOfMonth} now=${now.toISOString()}`,
        (result, periodStartDay, useLastDayOfMonth, now) =>
            `done periodStartDay=${periodStartDay} useLastDayOfMonth=${useLastDayOfMonth} now=${now.toISOString()} periodStart=${result.periodStart.toISOString()} nextPeriodStart=${result.nextPeriodStart.toISOString()}`,
        (error, periodStartDay, useLastDayOfMonth, now) =>
            `throw periodStartDay=${periodStartDay} useLastDayOfMonth=${useLastDayOfMonth} now=${now.toISOString()} error=${getErrorMessage(error)}`
    )
    computePeriodWindow(
        periodStartDay: number,
        useLastDayOfMonth: boolean,
        now: Date
    ): { readonly periodStart: Date; readonly nextPeriodStart: Date } {
        if (useLastDayOfMonth) {
            return this.computeEndOfMonthWindow(now);
        }

        return this.computeStartDayWindow(periodStartDay, now);
    }

    @Log(
        nextPeriodStart => `enter nextPeriodStart=${nextPeriodStart.toISOString()}`,
        (result, nextPeriodStart) => `done nextPeriodStart=${nextPeriodStart.toISOString()} inclusiveEnd=${result.toISOString()}`,
        (error, nextPeriodStart) => `throw nextPeriodStart=${nextPeriodStart.toISOString()} error=${getErrorMessage(error)}`
    )
    getInclusiveEnd(nextPeriodStart: Date): Date {
        return new Date(nextPeriodStart.getTime() - 1);
    }

    @Log(
        (now, months) => `enter now=${now.toISOString()} months=${months}`,
        (result, now, months) =>
            `done now=${now.toISOString()} months=${months} start=${result.start.toISOString()} end=${result.end.toISOString()}`,
        (error, now, months) => `throw now=${now.toISOString()} months=${months} error=${getErrorMessage(error)}`
    )
    computeTrailingMonthsWindow(now: Date, months: number): { readonly start: Date; readonly end: Date } {
        return {
            start: startOfMonth(subMonths(now, months)),
            end: startOfMonth(now)
        };
    }

    @Log(
        (operatedAtDates, windowStart, maxMonths, minEntriesPerMonth) =>
            `enter operatedAtDates=${operatedAtDates.map(date => date.toISOString()).join(',')} windowStart=${windowStart.toISOString()} maxMonths=${maxMonths} minEntriesPerMonth=${minEntriesPerMonth}`,
        (result, ...[operatedAtDates, windowStart, maxMonths, minEntriesPerMonth]) =>
            `done operatedAtDates=${operatedAtDates.map(date => date.toISOString()).join(',')} windowStart=${windowStart.toISOString()} maxMonths=${maxMonths} minEntriesPerMonth=${minEntriesPerMonth} months=${result}`,
        (error, ...[operatedAtDates, windowStart, maxMonths, minEntriesPerMonth]) =>
            `throw operatedAtDates=${operatedAtDates.map(date => date.toISOString()).join(',')} windowStart=${windowStart.toISOString()} maxMonths=${maxMonths} minEntriesPerMonth=${minEntriesPerMonth} error=${getErrorMessage(error)}`
    )
    resolveSuggestedWindowMonths(
        operatedAtDates: readonly Date[],
        windowStart: Date,
        maxMonths: number,
        minEntriesPerMonth: number
    ): number {
        const countsByMonth = this.buildCountsByMonth(operatedAtDates);
        let months = 0;

        for (let offset = maxMonths - 1; offset >= 0; offset -= 1) {
            const monthKey = this.buildMonthKey(addMonths(windowStart, offset));
            const monthCount = countsByMonth.get(monthKey);
            const count = isDefined(monthCount) ? monthCount : 0;

            if (count < minEntriesPerMonth) {
                break;
            }

            months += 1;
        }

        return months;
    }

    private computeEndOfMonthWindow(now: Date): { readonly periodStart: Date; readonly nextPeriodStart: Date } {
        const currentMonthEnd = startOfDay(endOfMonth(now));

        if (now.getTime() >= currentMonthEnd.getTime()) {
            return { periodStart: currentMonthEnd, nextPeriodStart: startOfDay(endOfMonth(addMonths(now, 1))) };
        }

        return { periodStart: startOfDay(endOfMonth(subMonths(now, 1))), nextPeriodStart: currentMonthEnd };
    }

    private computeStartDayWindow(periodStartDay: number, now: Date): { readonly periodStart: Date; readonly nextPeriodStart: Date } {
        const year = now.getFullYear();
        const monthIndex = now.getMonth();
        const startThisMonth = this.clampDayToMonth(year, monthIndex, periodStartDay);

        if (now.getTime() >= startThisMonth.getTime()) {
            const nextMonthDate = addMonths(setDate(new Date(year, monthIndex, 1), 1), 1);

            return {
                periodStart: startThisMonth,
                nextPeriodStart: this.clampDayToMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), periodStartDay)
            };
        }

        const previousMonthDate = subMonths(setDate(new Date(year, monthIndex, 1), 1), 1);

        return {
            periodStart: this.clampDayToMonth(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), periodStartDay),
            nextPeriodStart: startThisMonth
        };
    }

    private clampDayToMonth(year: number, monthIndex: number, day: number): Date {
        const lastDay = lastDayOfMonth(new Date(year, monthIndex, 1)).getDate();
        const clampedDay = Math.min(day, lastDay);

        return startOfDay(new Date(year, monthIndex, clampedDay));
    }

    private buildCountsByMonth(operatedAtDates: readonly Date[]): Map<string, number> {
        const countsByMonth = new Map<string, number>();

        for (const operatedAt of operatedAtDates) {
            const key = this.buildMonthKey(operatedAt);
            const previousCount = countsByMonth.get(key);
            const count = isDefined(previousCount) ? previousCount : 0;
            countsByMonth.set(key, count + 1);
        }

        return countsByMonth;
    }

    private buildMonthKey(date: Date): string {
        return `${getYear(date)}-${getMonth(date)}`;
    }
}

export const budgetPeriodService = new BudgetPeriodService();
