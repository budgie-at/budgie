import { PRECISION } from '@budgie/contracts';
import { addMonths } from 'date-fns/addMonths';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';

import { isDefined } from '@rnw-community/shared';

import { RecurringAlertEnum } from '../enum/recurring-alert.enum';

import { DAY_MS, DAYS_PER_MONTH, isSeriesActive, monthIndex } from './recurring-series';

import type { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import type { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringTrackedSeriesInterface } from '../interface/recurring-tracked-series.interface';

const PROJECTION_SUPPRESSION_RATIO = 0.4;
const PRICE_CHANGE_ALERT_DAYS = 183;
const OVERDUE_GRACE_DAYS = 2;

const expectedDays = (series: RecurringTrackedSeriesInterface, year: number, month: number): number[] => {
    if (isDefined(series.periodMonths)) {
        const monthsFromAnchor = monthIndex(new Date(year, month, 1).getTime()) - monthIndex(series.anchorTimestamp);

        return monthsFromAnchor < 0 || monthsFromAnchor % series.periodMonths !== 0
            ? []
            : [Math.min(new Date(series.anchorTimestamp).getDate(), getDaysInMonth(new Date(year, month, 1)))];
    }

    const stepMs = series.periodDays * DAY_MS;
    const firstStep = Math.max(Math.ceil((new Date(year, month, 1).getTime() - series.anchorTimestamp) / stepMs), 1);
    const lastStep = Math.floor((new Date(year, month + 1, 1).getTime() - 1 - series.anchorTimestamp) / stepMs);

    return Array.from({ length: Math.max(lastStep - firstStep + 1, 0) }, (_, index) =>
        new Date(series.anchorTimestamp + (firstStep + index) * stepMs).getDate()
    );
};

const findOverdueTimestamp = (series: RecurringTrackedSeriesInterface, now: Date): number | null => {
    const expectedTimestamp = isDefined(series.periodMonths)
        ? addMonths(new Date(series.anchorTimestamp), series.periodMonths).getTime()
        : series.anchorTimestamp + series.periodDays * DAY_MS;

    return isSeriesActive(series, now) && now.getTime() - expectedTimestamp > OVERDUE_GRACE_DAYS * DAY_MS ? expectedTimestamp : null;
};

const toEntry = (
    series: RecurringTrackedSeriesInterface,
    dayOfMonth: number,
    event: RecurringSeriesEventInterface | null,
    alert: RecurringAlertEnum | null
): RecurringCalendarEntryInterface => {
    const latestAmount = event?.amount ?? series.predictedAmount;
    const isForecast = !isDefined(event);

    return {
        key: `${series.seriesId}-${latestAmount}-${isForecast ? 'f' : 'a'}-${dayOfMonth}`,
        seriesId: series.seriesId,
        userState: series.userState,
        alert,
        title: series.title,
        categoryId: series.categoryId,
        categoryTitle: series.categoryTitle,
        categoryIcon: series.categoryIcon,
        accountId: series.accountId,
        latestAmount,
        latestTransactionId: event?.transactionId ?? null,
        dayOfMonth,
        isForecast
    };
};

const projectSeries = (
    series: RecurringTrackedSeriesInterface,
    year: number,
    month: number,
    now: Date
): RecurringCalendarEntryInterface[] => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 1).getTime();
    const monthsFromNow = monthIndex(monthStart) - monthIndex(now.getTime());
    const priceAlert =
        isDefined(series.priceChangedAt) && now.getTime() - series.priceChangedAt <= PRICE_CHANGE_ALERT_DAYS * DAY_MS
            ? RecurringAlertEnum.PRICE_CHANGE
            : null;
    const overdueTimestamp = findOverdueTimestamp(series, now);
    const actuals = series.events
        .filter(event => event.timestamp >= monthStart && event.timestamp < monthEnd)
        .map(event =>
            toEntry(series, new Date(event.timestamp).getDate(), event, event.timestamp === series.priceChangedAt ? priceAlert : null)
        );
    const overdue =
        isDefined(overdueTimestamp) && overdueTimestamp >= monthStart && overdueTimestamp < monthEnd
            ? [toEntry(series, new Date(overdueTimestamp).getDate(), null, RecurringAlertEnum.OVERDUE)]
            : [];
    const forecasts =
        monthsFromNow >= 0 && isSeriesActive(series, now)
            ? expectedDays(series, year, month)
                  .filter(day => monthsFromNow > 0 || day > now.getDate())
                  .filter(day =>
                      actuals.every(actual => Math.abs(actual.dayOfMonth - day) > series.periodDays * PROJECTION_SUPPRESSION_RATIO)
                  )
                  .map(day => toEntry(series, day, null, priceAlert))
            : [];

    return [...actuals, ...overdue, ...forecasts];
};

const groupByDay = (entries: readonly RecurringCalendarEntryInterface[]): Map<number, RecurringCalendarEntryInterface[]> =>
    entries.reduce(
        (groups, entry) => groups.set(entry.dayOfMonth, [...(groups.get(entry.dayOfMonth) ?? []), entry]),
        new Map<number, RecurringCalendarEntryInterface[]>()
    );

const sumExpenses = (entries: readonly RecurringCalendarEntryInterface[]): number =>
    entries.reduce((total, entry) => total + Math.max(entry.latestAmount, 0), 0) / PRECISION;

const sumCommitted = (series: readonly RecurringTrackedSeriesInterface[], now: Date, sign: number): number =>
    series
        .filter(item => isSeriesActive(item, now) && Math.sign(item.predictedAmount) === sign)
        .reduce((total, item) => total + Math.abs(item.predictedAmount) / (item.periodMonths ?? item.periodDays / DAYS_PER_MONTH), 0) /
    PRECISION;

export const projectRecurringMonth = (
    series: readonly RecurringTrackedSeriesInterface[],
    year: number,
    month: number,
    now: Date
): RecurringCalendarDataInterface => {
    const entries = series.flatMap(item => projectSeries(item, year, month, now));
    const actuals = entries.filter(entry => !entry.isForecast);
    const forecasts = entries.filter(entry => entry.isForecast);

    return {
        entriesByDay: groupByDay(actuals),
        forecastedEntriesByDay: groupByDay(forecasts),
        totalAmount: sumExpenses(actuals),
        forecastedTotalAmount: sumExpenses(forecasts),
        committedMonthlyExpense: sumCommitted(series, now, 1),
        committedMonthlyIncome: sumCommitted(series, now, -1)
    };
};
