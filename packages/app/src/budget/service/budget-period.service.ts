import { BudgetPeriodEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { PeriodDatesInterface } from '../util/budget-analytics-calculations.util';

class BudgetPeriodService {
    calculateMonthlyPeriodDates(startDay: number, referenceDate: Date = new Date()): PeriodDatesInterface {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const effectiveStartDay = Math.min(startDay, new Date(year, month + 1, 0).getDate());
        const startDate = new Date(year, month, effectiveStartDay, 0, 0, 0, 0);

        if (referenceDate < startDate) {
            startDate.setMonth(month - 1);
        }

        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const endDate = new Date(nextMonth);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateWeeklyPeriodDates(startDay: number, referenceDate: Date = new Date()): PeriodDatesInterface {
        const daysInWeek = 7;
        const dayOfWeek = referenceDate.getDay();
        const diff = dayOfWeek - (startDay % daysInWeek);
        const startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - (diff >= 0 ? diff : diff + daysInWeek));
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculatePeriodDatesForType(options: {
        period: BudgetPeriodEnum;
        startDay: number;
        referenceDate?: Date;
        customStartDate?: Date | null;
        customEndDate?: Date | null;
    }): PeriodDatesInterface {
        const { period, startDay, referenceDate = new Date(), customStartDate, customEndDate } = options;

        if (period === BudgetPeriodEnum.CUSTOM && isDefined(customStartDate) && isDefined(customEndDate)) {
            return { startDate: customStartDate, endDate: customEndDate };
        }

        if (period === BudgetPeriodEnum.WEEKLY) {
            return this.calculateWeeklyPeriodDates(startDay, referenceDate);
        }

        return this.calculateMonthlyPeriodDates(startDay, referenceDate);
    }

    calculateNextMonthlyPeriodDates(startDay: number, currentPeriodEndDate: Date): PeriodDatesInterface {
        const startDate = new Date(currentPeriodEndDate);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);

        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        const nextMonthStart = new Date(year, month + 1, startDay);
        const endDate = new Date(nextMonthStart);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateNextWeeklyPeriodDates(currentPeriodEndDate: Date): PeriodDatesInterface {
        const daysInWeek = 7;
        const startDate = new Date(currentPeriodEndDate);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + daysInWeek - 1);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

    calculateSafeToSpend(totalPlanned: number, totalActual: number, daysElapsed: number, totalDays: number): number {
        const idealSpent = (totalPlanned / totalDays) * daysElapsed;

        return Math.max(0, totalPlanned - totalActual - (totalPlanned - idealSpent));
    }

    calculateForecast(actual: number, daysElapsed: number, totalDays: number): number {
        if (daysElapsed <= 0) {
            return 0;
        }
        const dailyRate = actual / daysElapsed;

        return Math.round(dailyRate * totalDays);
    }

    calculateRollover(planned: number, actual: number, rule: BudgetRolloverRuleEnum, cap: number | null): number {
        const remaining = planned - actual;

        if (rule === BudgetRolloverRuleEnum.NONE) {
            return 0;
        }

        if (rule === BudgetRolloverRuleEnum.CARRY_POSITIVE) {
            if (remaining <= 0) {
                return 0;
            }

            return isDefined(cap) ? Math.min(remaining, cap) : remaining;
        }

        if (isDefined(cap)) {
            return remaining > 0 ? Math.min(remaining, cap) : Math.max(remaining, -cap);
        }

        return remaining;
    }

    formatPeriodLabel(period: BudgetPeriodEnum, startDate: Date): string {
        const options: Intl.DateTimeFormatOptions =
            period === BudgetPeriodEnum.WEEKLY ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' };

        const formatted = startDate.toLocaleDateString('en-US', options);
        const WEEK_PREFIX = 'Week of ';

        if (period === BudgetPeriodEnum.WEEKLY) {
            return WEEK_PREFIX + formatted;
        }

        return formatted;
    }
}

export const budgetPeriodService = new BudgetPeriodService();
