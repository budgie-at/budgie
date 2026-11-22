import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { addMonths } from 'date-fns/addMonths';
import { addWeeks } from 'date-fns/addWeeks';
import { addYears } from 'date-fns/addYears';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CADENCES } from '../constant/recurring-cadences.constant';
import { DAYS_PER_MONTH } from '../constant/recurring-days-per-month.constant';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
import type { RecurringScheduleInterface } from '../interface/recurring-schedule.interface';

const DAY_MS = 86_400_000;
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

const monthIndex = (date: Date): number => date.getFullYear() * MONTHS_PER_YEAR + date.getMonth();

const utcDay = (year: number, month: number, day: number): number => Date.UTC(year, month, day) / DAY_MS;

export const calendarDay = (date: Date): number => utcDay(date.getFullYear(), date.getMonth(), date.getDate());

const shiftMonths = (anchor: Date, months: number): number => {
    const month = anchor.getMonth() + months;
    const monthLength = utcDay(anchor.getFullYear(), month + 1, 1) - utcDay(anchor.getFullYear(), month, 1);

    return utcDay(anchor.getFullYear(), month, Math.min(anchor.getDate(), monthLength));
};

export const nearestCycle = (anchor: Date, date: Date, cadence: Pick<RecurringCadenceInterface, 'periodMonths' | 'periodDays'>) => {
    const day = calendarDay(date);
    const { periodMonths } = cadence;
    if (!isDefined(periodMonths)) {
        const cycle = Math.round((calendarDay(anchor) - day) / cadence.periodDays);

        return { cycle, deviation: Math.abs(day - (calendarDay(anchor) - cycle * cadence.periodDays)) };
    }
    const estimatedCycle = Math.round((monthIndex(anchor) - monthIndex(date)) / periodMonths);

    return [estimatedCycle - 1, estimatedCycle, estimatedCycle + 1]
        .map(cycle => ({ cycle, deviation: Math.abs(day - shiftMonths(anchor, -cycle * periodMonths)) }))
        .reduce((closest, candidate) => (candidate.deviation < closest.deviation ? candidate : closest));
};

export const cadencePeriodDays = (schedule: Pick<RecurringScheduleInterface, 'cadenceUnit' | 'cadenceInterval'>): number =>
    UNIT_PERIOD_DAYS[schedule.cadenceUnit] * schedule.cadenceInterval;

export const cadenceWindowDays = (schedule: Pick<RecurringScheduleInterface, 'cadenceUnit' | 'cadenceInterval'>): number => {
    const periodDays = cadencePeriodDays(schedule);

    return CADENCES.reduce((nearest, cadence) =>
        Math.abs(cadence.periodDays - periodDays) < Math.abs(nearest.periodDays - periodDays) ? cadence : nearest
    ).windowDays;
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
