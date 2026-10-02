import { getDaysInMonth } from 'date-fns/getDaysInMonth';

import { isDefined } from '@rnw-community/shared';

import { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import { RecurringCalendarAccumulator } from '../service/recurring-calendar-accumulator';

const DAY_MS = 86_400_000;
const PROJECTION_SUPPRESSION_RATIO = 0.4;

const buildExpectedDays = (series: RecurringSeriesInterface, year: number, month: number, daysInMonth: number): number[] => {
    if (isDefined(series.periodMonths)) {
        const anchor = new Date(series.anchorTimestamp);
        const monthDiff = year * 12 + month - (anchor.getFullYear() * 12 + anchor.getMonth());
        if (monthDiff < 0 || monthDiff % series.periodMonths !== 0) {
            return [];
        }

        return [Math.min(anchor.getDate(), daysInMonth)];
    }

    const monthStart = new Date(year, month, 1).getTime();
    const firstStep = Math.max(Math.ceil((monthStart - series.anchorTimestamp) / (series.periodDays * DAY_MS)), 1);
    const lastStep = Math.floor((new Date(year, month + 1, 1).getTime() - 1 - series.anchorTimestamp) / (series.periodDays * DAY_MS));
    const days: number[] = [];
    for (let step = firstStep; step <= lastStep; step += 1) {
        days.push(new Date(series.anchorTimestamp + step * series.periodDays * DAY_MS).getDate());
    }

    return days;
};

const projectSeries = (
    item: RecurringSeriesInterface,
    accumulator: RecurringCalendarAccumulator,
    context: {
        readonly year: number;
        readonly month: number;
        readonly daysInMonth: number;
        readonly monthStart: number;
        readonly monthEnd: number;
        readonly isPastMonth: boolean;
        readonly isCurrentMonth: boolean;
        readonly today: number;
    }
): void => {
    const actuals = item.events.filter(event => event.timestamp >= context.monthStart && event.timestamp < context.monthEnd);
    for (const actual of actuals) {
        accumulator.addActual(item, actual);
    }

    if (context.isPastMonth) {
        return;
    }

    for (const day of buildExpectedDays(item, context.year, context.month, context.daysInMonth)) {
        const isCovered = actuals.some(actual => Math.abs(actual.day - day) <= item.periodDays * PROJECTION_SUPPRESSION_RATIO);
        const isFuture = !context.isCurrentMonth || day > context.today;
        if (isFuture && !isCovered) {
            accumulator.addForecast(item, day);
        }
    }
};

export const projectRecurringMonth = (
    series: readonly RecurringSeriesInterface[],
    year: number,
    month: number,
    now: Date
): RecurringCalendarDataInterface => {
    const targetMonthIndex = year * 12 + month;
    const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
    const context = {
        year,
        month,
        daysInMonth: getDaysInMonth(new Date(year, month, 1)),
        monthStart: new Date(year, month, 1).getTime(),
        monthEnd: new Date(year, month + 1, 1).getTime(),
        isPastMonth: targetMonthIndex < currentMonthIndex,
        isCurrentMonth: targetMonthIndex === currentMonthIndex,
        today: now.getDate()
    };

    const accumulator = new RecurringCalendarAccumulator();
    for (const item of series) {
        projectSeries(item, accumulator, context);
    }

    return accumulator.build();
};
