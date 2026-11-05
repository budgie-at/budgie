import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { addMonths } from 'date-fns/addMonths';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CADENCES, DAYS_PER_MONTH } from './recurring-series';

import type { RecurringScheduleInterface } from '../interface/recurring-schedule.interface';

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const UNIT_PERIOD_DAYS: Record<RecurringCadenceUnitEnum, number> = {
    [RecurringCadenceUnitEnum.WEEK]: 7,
    [RecurringCadenceUnitEnum.MONTH]: DAYS_PER_MONTH,
    [RecurringCadenceUnitEnum.YEAR]: DAYS_PER_MONTH * MONTHS_PER_YEAR
};
const UNIT_MONTHLY_FACTOR: Record<RecurringCadenceUnitEnum, number> = {
    [RecurringCadenceUnitEnum.WEEK]: WEEKS_PER_YEAR / MONTHS_PER_YEAR,
    [RecurringCadenceUnitEnum.MONTH]: 1,
    [RecurringCadenceUnitEnum.YEAR]: 1 / MONTHS_PER_YEAR
};
const UNIT_ADDERS: Record<RecurringCadenceUnitEnum, (date: Date, amount: number) => Date> = {
    [RecurringCadenceUnitEnum.WEEK]: addWeeks,
    [RecurringCadenceUnitEnum.MONTH]: addMonths,
    [RecurringCadenceUnitEnum.YEAR]: addYears
};

export const cadencePeriodDays = (schedule: Pick<RecurringScheduleInterface, 'cadenceUnit' | 'cadenceInterval'>): number =>
    UNIT_PERIOD_DAYS[schedule.cadenceUnit] * schedule.cadenceInterval;

export const cadenceToleranceDays = (schedule: Pick<RecurringScheduleInterface, 'cadenceUnit' | 'cadenceInterval'>): number => {
    const periodDays = cadencePeriodDays(schedule);

    return CADENCES.reduce((nearest, cadence) =>
        Math.abs(cadence.periodDays - periodDays) < Math.abs(nearest.periodDays - periodDays) ? cadence : nearest
    ).toleranceDays;
};

export const cycleDateAt = (schedule: RecurringScheduleInterface, cycle: number): Date =>
    UNIT_ADDERS[schedule.cadenceUnit](startOfDay(schedule.anchorDate), cycle * schedule.cadenceInterval);

export const nearestCycleDate = (schedule: RecurringScheduleInterface, date: Date) => {
    const estimate = Math.round(differenceInCalendarDays(date, schedule.anchorDate) / cadencePeriodDays(schedule));

    return [estimate - 1, estimate, estimate + 1]
        .map(cycle => {
            const cycleDate = cycleDateAt(schedule, cycle);

            return { cycle, cycleDate, deviationDays: Math.abs(differenceInCalendarDays(date, cycleDate)) };
        })
        .reduce((closest, candidate) => (candidate.deviationDays < closest.deviationDays ? candidate : closest));
};

export const nextOccurrences = (schedule: RecurringScheduleInterface, from: Date, count: number): Date[] => {
    if (!isPositiveNumber(schedule.cadenceInterval)) {
        return [];
    }
    const fromDay = startOfDay(from);
    const dates: Date[] = [];
    let cycle = Math.max(0, Math.floor(differenceInCalendarDays(fromDay, schedule.anchorDate) / cadencePeriodDays(schedule)) - 1);

    while (dates.length < count) {
        const date = cycleDateAt(schedule, cycle);

        if (isDefined(schedule.endsAt) && differenceInCalendarDays(date, schedule.endsAt) > 0) {
            break;
        }
        if (date.getTime() >= fromDay.getTime()) {
            dates.push(date);
        }
        cycle += 1;
    }

    return dates;
};

export const occurrencesInRange = (schedule: RecurringScheduleInterface, from: Date, to: Date): Date[] => {
    if (!isPositiveNumber(schedule.cadenceInterval)) {
        return [];
    }
    const dates: Date[] = [];
    let cycle = Math.max(0, Math.floor(differenceInCalendarDays(from, schedule.anchorDate) / cadencePeriodDays(schedule)) - 1);
    let date = cycleDateAt(schedule, cycle);

    while (date.getTime() < to.getTime() && !(isDefined(schedule.endsAt) && differenceInCalendarDays(date, schedule.endsAt) > 0)) {
        if (date.getTime() >= from.getTime()) {
            dates.push(date);
        }
        cycle += 1;
        date = cycleDateAt(schedule, cycle);
    }

    return dates;
};

export const monthlyEquivalent = (
    series: Pick<RecurringScheduleInterface, 'cadenceUnit' | 'cadenceInterval'> & { readonly amount: number }
): number => (series.amount * UNIT_MONTHLY_FACTOR[series.cadenceUnit]) / series.cadenceInterval;
