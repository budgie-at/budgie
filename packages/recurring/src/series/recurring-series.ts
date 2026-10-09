import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

export const DAY_MS = 86_400_000;
export const DAYS_PER_MONTH = 30.44;
const RECENT_INTERVAL_COUNT = 3;
const RECENT_AMOUNT_COUNT = 3;
const AMOUNT_RATIO = 1.12;
const PRICE_CHANGE_RATIO = 0.05;
const ACTIVE_PERIOD_RATIO = 1.5;
const CADENCES: readonly RecurringCadenceInterface[] = [
    { periodMonths: null, periodDays: 7, toleranceDays: 1 },
    { periodMonths: null, periodDays: 14, toleranceDays: 2 },
    { periodMonths: 1, periodDays: DAYS_PER_MONTH, toleranceDays: 8 },
    { periodMonths: 3, periodDays: DAYS_PER_MONTH * 3, toleranceDays: 10 },
    { periodMonths: 12, periodDays: DAYS_PER_MONTH * 12, toleranceDays: 10 }
];
const LEGACY_STOP_TOKENS = new Set('GMBH AG KG CO INC LTD LLC OG ФОП ТОВ ПП ПАТ АТ ВІД'.split(' '));

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const monthIndex = (timestamp: number): number => {
    const date = new Date(timestamp);

    return date.getFullYear() * 12 + date.getMonth();
};

const description = (charge: RecurringChargeInterface): string => (isNotEmptyString(charge.title) ? charge.title : charge.comment);

const counterpartyKey = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(charge.counterpartyIban)
        ? charge.counterpartyIban.replaceAll(/\s/gu, '').toUpperCase()
        : normalizeRecurringDescription(description(charge));

const identity = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(counterpartyKey(charge))
        ? `${charge.kind}|${charge.instrumentId}|${charge.mccCategoryId ?? charge.categoryId ?? ''}|${counterpartyKey(charge)}`
        : '';

const legacyLabel = (charge: RecurringChargeInterface): string =>
    description(charge)
        .replace(/(MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO).*$/iu, '')
        .replaceAll(/\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu, ' ')
        .split(/[^\p{L}\p{N}]+/u)
        .filter(token => isNotEmptyString(token) && !/^\d+$|\d{3,}/u.test(token) && !LEGACY_STOP_TOKENS.has(token.toUpperCase()))
        .join(' ')
        .toUpperCase();

const toEvents = (charges: readonly RecurringChargeInterface[]): RecurringSeriesEventInterface[] => {
    const events: RecurringSeriesEventInterface[] = [];
    for (const charge of [...charges].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime())) {
        const timestamp = new Date(charge.operatedAt.getFullYear(), charge.operatedAt.getMonth(), charge.operatedAt.getDate()).getTime();
        const previous = events[events.length - 1];
        if (isDefined(previous) && timestamp === previous.timestamp) {
            events[events.length - 1] = {
                ...previous,
                nativeAmount: previous.nativeAmount + charge.nativeAmount,
                amount: previous.amount + charge.defaultAmount,
                occurrenceCount: previous.occurrenceCount + 1,
                transactionId: Math.max(previous.transactionId, charge.transactionId)
            };
        } else {
            events.push({
                timestamp,
                nativeAmount: charge.nativeAmount,
                amount: charge.defaultAmount,
                occurrenceCount: 1,
                transactionId: charge.transactionId
            });
        }
    }

    return events;
};

const isStableAmount = (events: readonly RecurringSeriesEventInterface[]): boolean =>
    Math.max(...events.map(event => event.nativeAmount)) <= Math.min(...events.map(event => event.nativeAmount)) * AMOUNT_RATIO;

const isAlignedCadence = (events: readonly RecurringSeriesEventInterface[], cadence: RecurringCadenceInterface): boolean => {
    const gaps = events
        .slice(1)
        .map((event, index) => differenceInCalendarDays(new Date(event.timestamp), new Date(events[index].timestamp)));
    const medianGap = median(gaps);
    if (Math.abs(medianGap - cadence.periodDays) > cadence.toleranceDays) {
        return false;
    }
    const exceptions = gaps.filter(gap => Math.abs(gap - cadence.periodDays) > cadence.toleranceDays);
    if (exceptions.length > 1 || exceptions.some(gap => gap > 2 && Math.abs(gap - cadence.periodDays * 2) > cadence.toleranceDays)) {
        return false;
    }
    const anchor = new Date(events[events.length - 1].timestamp);

    return events.every(event => {
        const date = new Date(event.timestamp);
        const cycles = isDefined(cadence.periodMonths)
            ? Math.round((monthIndex(anchor.getTime()) - monthIndex(event.timestamp)) / cadence.periodMonths)
            : Math.round(differenceInCalendarDays(anchor, date) / cadence.periodDays);
        const expected = isDefined(cadence.periodMonths)
            ? addMonths(anchor, -cycles * cadence.periodMonths)
            : addDays(anchor, -cycles * cadence.periodDays);

        return Math.abs(differenceInCalendarDays(date, expected)) <= cadence.toleranceDays;
    });
};

const findCadence = (events: readonly RecurringSeriesEventInterface[]): RecurringCadenceInterface | undefined =>
    CADENCES.find(
        cadence =>
            events.length >= (cadence.periodMonths === 12 ? 2 : 3) && isAlignedCadence(events.slice(-RECENT_INTERVAL_COUNT - 1), cadence)
    );

const buildSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface | null => {
    const events = toEvents(charges);
    const cadence = findCadence(events);
    const recent = events.slice(-RECENT_AMOUNT_COUNT);
    if (
        !isDefined(cadence) ||
        !isStableAmount(recent) ||
        new Set(events.slice(-RECENT_INTERVAL_COUNT - 1).map(event => event.occurrenceCount)).size !== 1
    ) {
        return null;
    }
    const latest = charges.reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const priceChangeIndex = events.findLastIndex(
        (event, index) =>
            index > 0 &&
            Math.abs(event.nativeAmount - events[index - 1].nativeAmount) > events[index - 1].nativeAmount * PRICE_CHANGE_RATIO &&
            isStableAmount(events.slice(index)) &&
            isStableAmount(events.slice(Math.max(0, index - RECENT_AMOUNT_COUNT), index))
    );
    const nativeAmount = Math.round(
        median((priceChangeIndex > 0 ? events.slice(priceChangeIndex) : recent).map(event => event.nativeAmount))
    );

    return {
        kind: latest.kind,
        instrumentId: latest.instrumentId,
        nativeAmount,
        merchantKey: identity(latest),
        labels: [...new Set([identity(latest), normalizeRecurringDescription(description(latest)), ...charges.map(legacyLabel)])],
        title: normalizeRecurringDescription(description(latest)).split(' ').slice(0, 3).join(' '),
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        periodMonths: cadence.periodMonths,
        periodDays: cadence.periodDays,
        anchorTimestamp: events[events.length - 1].timestamp,
        predictedAmount: Math.round((nativeAmount * latest.defaultAmount) / latest.nativeAmount),
        priceChangedAt: priceChangeIndex > 0 ? events[priceChangeIndex].timestamp : null,
        events
    };
};

const detectMerchantSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const whole = buildSeries(charges);
    if (isDefined(whole)) {
        return [whole];
    }
    const sorted = [...charges].sort((first, second) => first.nativeAmount - second.nativeAmount);
    const gaps = sorted.slice(1).map((charge, index) => charge.nativeAmount / sorted[index].nativeAmount);
    const largestGap = Math.max(...gaps);
    if (largestGap <= AMOUNT_RATIO) {
        return [];
    }
    const splitIndex = gaps.indexOf(largestGap) + 1;

    return [sorted.slice(0, splitIndex), sorted.slice(splitIndex)]
        .map((group, index) => {
            const series = buildSeries(group);

            return isDefined(series) && series.periodMonths !== 12 ? { ...series, merchantKey: `${series.merchantKey}|${index}` } : null;
        })
        .filter(isDefined);
};

export const detectRecurringSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const groups = new Map<string, RecurringChargeInterface[]>();
    for (const charge of charges) {
        const key = identity(charge);
        if (isNotEmptyString(key)) {
            groups.set(key, [...(groups.get(key) ?? []), charge]);
        }
    }

    return [...groups.values()].flatMap(group => {
        const series = detectMerchantSeries(group);

        return series.filter(
            candidate =>
                candidate.periodMonths !== 12 ||
                candidate.events.length > 2 ||
                !charges.some(
                    charge =>
                        charge.kind === group[0].kind &&
                        charge.instrumentId !== group[0].instrumentId &&
                        (charge.mccCategoryId ?? charge.categoryId) === (group[0].mccCategoryId ?? group[0].categoryId) &&
                        counterpartyKey(charge) === counterpartyKey(group[0]) &&
                        charge.operatedAt.getTime() >= candidate.events[0].timestamp
                )
        );
    });
};

export const isSeriesActive = (series: RecurringSeriesInterface, now: Date): boolean =>
    differenceInCalendarDays(now, new Date(series.anchorTimestamp)) <= series.periodDays * ACTIVE_PERIOD_RATIO;
