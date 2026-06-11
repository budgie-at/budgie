import { addMonths, endOfMonth, getMonth, getYear, lastDayOfMonth, setDate, startOfDay, startOfMonth, subMonths } from 'date-fns';

import { isDefined } from '@rnw-community/shared';

import type { BudgetDatedEntryInterface } from '../interface/budget-dated-entry.interface';
import type { BudgetPeriodWindowInterface } from '../interface/budget-period-window.interface';
import type { BudgetTrailingMonthsWindowInterface } from '../interface/budget-trailing-months-window.interface';

class BudgetPeriodService {
    computePeriodWindow(periodStartDay: number, useLastDayOfMonth: boolean, now: Date): BudgetPeriodWindowInterface {
        if (useLastDayOfMonth) {
            return this.computeEndOfMonthWindow(now);
        }

        return this.computeStartDayWindow(periodStartDay, now);
    }

    getInclusiveEnd(nextPeriodStart: Date): Date {
        return new Date(nextPeriodStart.getTime() - 1);
    }

    computeTrailingMonthsWindow(now: Date, months: number): BudgetTrailingMonthsWindowInterface {
        return {
            start: startOfMonth(subMonths(now, months)),
            end: startOfMonth(now)
        };
    }

    resolveSuggestedWindowMonths(
        entries: readonly BudgetDatedEntryInterface[],
        windowStart: Date,
        maxMonths: number,
        minEntriesPerMonth: number
    ): number {
        const countsByMonth = this.buildCountsByMonth(entries);
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

    private computeEndOfMonthWindow(now: Date): BudgetPeriodWindowInterface {
        const currentMonthEnd = startOfDay(endOfMonth(now));

        if (now.getTime() >= currentMonthEnd.getTime()) {
            return { periodStart: currentMonthEnd, nextPeriodStart: startOfDay(endOfMonth(addMonths(now, 1))) };
        }

        return { periodStart: startOfDay(endOfMonth(subMonths(now, 1))), nextPeriodStart: currentMonthEnd };
    }

    private computeStartDayWindow(periodStartDay: number, now: Date): BudgetPeriodWindowInterface {
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

    private buildCountsByMonth(entries: readonly BudgetDatedEntryInterface[]): Map<string, number> {
        const countsByMonth = new Map<string, number>();

        for (const entry of entries) {
            const key = this.buildMonthKey(entry.operatedAt);
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
