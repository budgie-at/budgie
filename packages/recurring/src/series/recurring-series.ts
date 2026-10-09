import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

export const DAY_MS = 86_400_000;
export const DAYS_PER_MONTH = 30.44;
const RECENT_INTERVAL_COUNT = 4;
const RECENT_AMOUNT_COUNT = 3;
const PRICE_CHANGE_RATIO = 0.05;
const ACTIVE_PERIOD_RATIO = 1.5;
const CADENCES: readonly RecurringCadenceInterface[] = [
    { periodMonths: null, periodDays: 7, toleranceDays: 1 },
    { periodMonths: null, periodDays: 14, toleranceDays: 2 },
    { periodMonths: 1, periodDays: DAYS_PER_MONTH, toleranceDays: 4 },
    { periodMonths: 2, periodDays: DAYS_PER_MONTH * 2, toleranceDays: 7 },
    { periodMonths: 3, periodDays: DAYS_PER_MONTH * 3, toleranceDays: 8 },
    { periodMonths: 6, periodDays: DAYS_PER_MONTH * 6, toleranceDays: 10 },
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
    isNotEmptyString(counterpartyKey(charge)) ? `${charge.kind}|${charge.instrumentId}|${counterpartyKey(charge)}` : '';

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
    const seen = new Set<string>();
    for (const charge of [...charges].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime())) {
        const timestamp = new Date(charge.operatedAt.getFullYear(), charge.operatedAt.getMonth(), charge.operatedAt.getDate()).getTime();
        const duplicateKey = `${charge.accountId}|${timestamp}|${charge.nativeAmount}`;
        if (!seen.has(duplicateKey)) {
            seen.add(duplicateKey);
            events.push({
                timestamp,
                nativeAmount: charge.nativeAmount,
                amount: charge.defaultAmount,
                transactionId: charge.transactionId
            });
        }
    }

    return events;
};

const isStableAmount = (events: readonly RecurringSeriesEventInterface[]): boolean =>
    Math.max(...events.map(event => event.nativeAmount)) <= Math.min(...events.map(event => event.nativeAmount)) * RECURRING_AMOUNT_RATIO;

const isAlignedCadence = (
    events: readonly RecurringSeriesEventInterface[],
    cadence: RecurringCadenceInterface,
    variable: boolean,
    observationCount: number
): boolean => {
    const gapKinds = events.slice(1).map((event, index) => {
        const previous = new Date(events[index].timestamp);
        const current = new Date(event.timestamp);
        const next = isDefined(cadence.periodMonths) ? addMonths(previous, cadence.periodMonths) : addDays(previous, cadence.periodDays);
        const missed = isDefined(cadence.periodMonths)
            ? addMonths(previous, cadence.periodMonths * 2)
            : addDays(previous, cadence.periodDays * 2);
        if (Math.abs(differenceInCalendarDays(current, next)) <= cadence.toleranceDays) {
            return 0;
        }

        return Math.abs(differenceInCalendarDays(current, missed)) <= cadence.toleranceDays ? 1 : 2;
    });
    const missedCycles = gapKinds.filter(kind => kind === 1);
    if (
        gapKinds.includes(2) ||
        missedCycles.length > 1 ||
        (variable && isNotEmptyArray(missedCycles)) ||
        (gapKinds.length - missedCycles.length) / (observationCount - 1) < 0.75
    ) {
        return false;
    }
    const anchor = new Date(events[events.length - 1].timestamp);

    const alignedCycles = events.map(event => {
        const date = new Date(event.timestamp);
        const estimatedCycle = isDefined(cadence.periodMonths)
            ? Math.round((monthIndex(anchor.getTime()) - monthIndex(event.timestamp)) / cadence.periodMonths)
            : Math.round(differenceInCalendarDays(anchor, date) / cadence.periodDays);

        return (isDefined(cadence.periodMonths) ? [estimatedCycle - 1, estimatedCycle, estimatedCycle + 1] : [estimatedCycle])
            .map(cycle => {
                const expected = isDefined(cadence.periodMonths)
                    ? addMonths(anchor, -cycle * cadence.periodMonths)
                    : addDays(anchor, -cycle * cadence.periodDays);

                return { cycle, deviation: Math.abs(differenceInCalendarDays(date, expected)) };
            })
            .reduce((closest, candidate) => (candidate.deviation < closest.deviation ? candidate : closest));
    });

    return (
        alignedCycles.every(candidate => candidate.deviation <= cadence.toleranceDays) &&
        new Set(alignedCycles.map(candidate => candidate.cycle)).size === events.length
    );
};

const billingEvents = (
    events: readonly RecurringSeriesEventInterface[],
    cadence: RecurringCadenceInterface
): RecurringSeriesEventInterface[] =>
    events.reduce<RecurringSeriesEventInterface[]>((cycles, event) => {
        const previous = cycles[cycles.length - 1];
        if (
            !isDefined(previous) ||
            differenceInCalendarDays(new Date(event.timestamp), new Date(previous.timestamp)) > Math.floor(cadence.periodDays / 10)
        ) {
            cycles.push(event);
        }

        return cycles;
    }, []);

const findCadence = (events: readonly RecurringSeriesEventInterface[], variable: boolean): RecurringCadenceInterface | undefined =>
    CADENCES.find(cadence => {
        const recent = events.slice(variable ? -4 : -RECENT_INTERVAL_COUNT - 1);
        const restartIndex = recent.findLastIndex(
            (event, index) =>
                index > 0 &&
                differenceInCalendarDays(new Date(event.timestamp), new Date(recent[index - 1].timestamp)) >
                    cadence.periodDays * 2 + cadence.toleranceDays
        );
        const observations = recent.slice(Math.max(0, restartIndex));
        const current = variable ? observations : billingEvents(observations, cadence);
        const minimumEvents = variable ? 4 : 3;

        return (
            current.length >= (cadence.periodMonths === 12 && !variable ? 2 : minimumEvents) &&
            isAlignedCadence(current, cadence, variable, observations.length)
        );
    });

const buildSeries = (charges: readonly RecurringChargeInterface[], variable = false): RecurringSeriesInterface | null => {
    const observations = toEvents(charges);
    if (
        new Set(observations.slice(-RECENT_INTERVAL_COUNT - 1).map(event => event.timestamp)).size !==
        observations.slice(-RECENT_INTERVAL_COUNT - 1).length
    ) {
        return null;
    }
    const cadence = findCadence(observations, variable);
    if (!isDefined(cadence)) {
        return null;
    }
    const events = variable ? observations : billingEvents(observations, cadence);
    const latest = charges.reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const priceChangeIndex = variable
        ? -1
        : events.findLastIndex(
              (event, index) =>
                  index > 0 &&
                  Math.abs(event.nativeAmount - events[index - 1].nativeAmount) > events[index - 1].nativeAmount * PRICE_CHANGE_RATIO &&
                  isStableAmount(events.slice(index)) &&
                  isStableAmount(events.slice(Math.max(0, index - RECENT_AMOUNT_COUNT), index))
          );
    const latestEvent = events[events.length - 1];
    const nativeAmount = Math.round(
        median(
            (priceChangeIndex > 0 ? events.slice(priceChangeIndex) : events.slice(-RECENT_AMOUNT_COUNT)).map(event => event.nativeAmount)
        )
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
        anchorTimestamp: latestEvent.timestamp,
        predictedAmount: Math.round((nativeAmount * latestEvent.amount) / latestEvent.nativeAmount),
        priceChangedAt: priceChangeIndex > 0 ? events[priceChangeIndex].timestamp : null,
        events
    };
};

const detectMerchantSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const clusters: RecurringChargeInterface[][] = [];
    for (const charge of [...charges].sort((first, second) => first.nativeAmount - second.nativeAmount)) {
        const cluster = clusters[clusters.length - 1];
        if (isDefined(cluster) && charge.nativeAmount <= cluster[0].nativeAmount * RECURRING_AMOUNT_RATIO) {
            cluster.push(charge);
        } else {
            clusters.push([charge]);
        }
    }
    const fixed = clusters
        .map(group => {
            const series = buildSeries(group);

            return isDefined(series) ? { ...series, merchantKey: `${series.merchantKey}|${group[0].nativeAmount}` } : null;
        })
        .filter(isDefined);
    const latestTimestamp = Math.max(...charges.map(charge => charge.operatedAt.getTime()));
    const currentFixed = fixed
        .filter(
            series =>
                differenceInCalendarDays(new Date(latestTimestamp), new Date(series.anchorTimestamp)) <=
                series.periodDays * ACTIVE_PERIOD_RATIO
        )
        .map(series => {
            const previous = fixed.find(
                candidate =>
                    candidate.anchorTimestamp < series.events[0].timestamp &&
                    candidate.periodMonths === series.periodMonths &&
                    candidate.periodDays === series.periodDays &&
                    Math.abs(candidate.nativeAmount - series.nativeAmount) > candidate.nativeAmount * PRICE_CHANGE_RATIO &&
                    differenceInCalendarDays(new Date(series.events[0].timestamp), new Date(candidate.anchorTimestamp)) <=
                        series.periodDays * ACTIVE_PERIOD_RATIO
            );

            return isDefined(previous) ? { ...series, priceChangedAt: series.events[0].timestamp } : series;
        });

    return isNotEmptyArray(currentFixed) || isStableAmount(toEvents(charges))
        ? currentFixed
        : [buildSeries(charges, true)].filter(isDefined);
};

export const detectRecurringSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const groups = new Map<string, RecurringChargeInterface[]>();
    for (const charge of charges) {
        const key = identity(charge);
        if (charge.kind === RecurringSeriesKindEnum.EXPENSE && isNotEmptyString(key)) {
            groups.set(key, [...(groups.get(key) ?? []), charge]);
        }
    }

    return [...groups.values()].flatMap(group => {
        const series = detectMerchantSeries(group);

        return series.filter(
            candidate =>
                candidate.periodMonths !== 12 ||
                candidate.events.length > 2 ||
                (toEvents(group).length === 2 &&
                    !charges.some(
                        charge =>
                            charge.kind === group[0].kind &&
                            charge.instrumentId !== group[0].instrumentId &&
                            counterpartyKey(charge) === counterpartyKey(group[0]) &&
                            charge.operatedAt.getTime() >= candidate.events[0].timestamp
                    ))
        );
    });
};

export const isSeriesActive = (series: RecurringSeriesInterface, now: Date): boolean =>
    differenceInCalendarDays(now, new Date(series.anchorTimestamp)) <= series.periodDays * ACTIVE_PERIOD_RATIO;
