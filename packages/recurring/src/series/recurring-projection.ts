import { PRECISION, RecurringSeriesKindEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import { RecurringAlertEnum } from '../enum/recurring-alert.enum';

import { findPriceChange, hasPriceChange, isCycleCovered, resolveRecurringAlert } from './recurring-alert';
import { cadencePeriodDays, cadenceToleranceDays, monthlyEquivalent, occurrencesInRange } from './recurring-schedule';
import { countsInForecasts, isSeriesEnded } from './recurring-state';

import type { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import type { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';
import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringReadModelInterface } from '../interface/recurring-read-model.interface';

const toEntry = (
    model: RecurringReadModelInterface,
    dayOfMonth: number,
    charge: RecurringChargeInterface | null,
    alert: RecurringAlertEnum | null
): RecurringCalendarEntryInterface => {
    const latestAmount = charge?.defaultAmount ?? model.series.defaultAmount;
    const isForecast = !isDefined(charge);

    return {
        key: `${model.series.id}-${latestAmount}-${isForecast ? 'f' : 'a'}-${dayOfMonth}`,
        seriesId: model.series.id,
        userState: model.series.userState,
        alert,
        title: model.series.title,
        categoryId: model.series.categoryId,
        categoryTitle: model.series.categoryTitle,
        categoryIcon: model.series.categoryIcon,
        accountId: model.series.accountId ?? charge?.accountId ?? null,
        latestAmount,
        latestTransactionId: charge?.transactionId ?? null,
        dayOfMonth,
        periodDays: Math.round(cadencePeriodDays(model.series)),
        isForecast
    };
};

const projectSeries = (model: RecurringReadModelInterface, year: number, month: number, now: Date): RecurringCalendarEntryInterface[] => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const today = startOfDay(now);
    const alert = resolveRecurringAlert(model, now);
    const linked = model.links
        .filter(({ link }) => !link.isExcluded)
        .sort((first, second) => first.charge.operatedAt.getTime() - second.charge.operatedAt.getTime());
    const latestLinkedAt = linked[linked.length - 1]?.charge.operatedAt.getTime() ?? Number.NEGATIVE_INFINITY;
    const priceChangeTransactionId = findPriceChange(model, now)?.transactionId;
    const actuals = linked
        .filter(({ charge }) => charge.operatedAt.getTime() >= monthStart.getTime() && charge.operatedAt.getTime() < monthEnd.getTime())
        .map(({ charge }) =>
            toEntry(
                model,
                charge.operatedAt.getDate(),
                charge,
                charge.transactionId === priceChangeTransactionId ? RecurringAlertEnum.PRICE_CHANGE : null
            )
        );
    const monthsFromNow = (year - now.getFullYear()) * 12 + month - now.getMonth();
    const tolerance = cadenceToleranceDays(model.series);
    const forecastAlert = (date: Date): RecurringAlertEnum | null => {
        if (differenceInCalendarDays(today, date) > tolerance) {
            return RecurringAlertEnum.OVERDUE;
        }

        if (hasPriceChange(model, now)) {
            return RecurringAlertEnum.PRICE_CHANGE;
        }

        return alert === RecurringAlertEnum.ENDING ? alert : null;
    };
    const forecasts =
        monthsFromNow >= 0 && !isSeriesEnded(model.series, now)
            ? occurrencesInRange(model.series, monthStart, monthEnd)
                  .filter(date => date.getTime() > latestLinkedAt && !isCycleCovered(model, date))
                  .map(date => toEntry(model, date.getDate(), null, forecastAlert(date)))
            : [];

    return [...actuals, ...forecasts];
};

const groupByDay = (entries: readonly RecurringCalendarEntryInterface[]): Map<number, RecurringCalendarEntryInterface[]> =>
    entries.reduce(
        (groups, entry) => groups.set(entry.dayOfMonth, [...(groups.get(entry.dayOfMonth) ?? []), entry]),
        new Map<number, RecurringCalendarEntryInterface[]>()
    );

const sumCommitted = (models: readonly RecurringReadModelInterface[], now: Date): number =>
    models
        .filter(({ series }) => !isSeriesEnded(series, now))
        .reduce((total, { series }) => total + monthlyEquivalent({ ...series, amount: series.defaultAmount }), 0) / PRECISION;

// eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments; kind is appended
export const projectRecurringMonth = (
    models: readonly RecurringReadModelInterface[],
    year: number,
    month: number,
    now: Date,
    kind: RecurringSeriesKindEnum
): RecurringCalendarDataInterface => {
    const eligible = models.filter(({ series }) => series.kind === kind && countsInForecasts(series));
    const entries = eligible.flatMap(model => projectSeries(model, year, month, now));
    const actuals = entries.filter(entry => !entry.isForecast);
    const forecasts = entries.filter(entry => entry.isForecast);

    return {
        entriesByDay: groupByDay(actuals),
        forecastedEntriesByDay: groupByDay(forecasts),
        totalAmount: actuals.reduce((total, entry) => total + entry.latestAmount, 0) / PRECISION,
        forecastedTotalAmount:
            forecasts
                .filter(entry => new Date(year, month, entry.dayOfMonth + 1).getTime() > now.getTime())
                .reduce((total, entry) => total + entry.latestAmount, 0) / PRECISION,
        committedMonthlyExpense: sumCommitted(eligible, now)
    };
};
