import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Arr from 'effect/Array';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { CADENCES } from '../constant/recurring-cadences.constant';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { continueRecurringSeries } from './recurring-continuation';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

const LEGACY_STOP_TOKENS = new Set('GMBH AG KG CO INC LTD LLC OG ФОП ТОВ ПП ПАТ АТ ВІД'.split(' '));
const IDENTITY_TOKEN_SEPARATOR = /[^\p{L}\p{N}]+/u;
const DISPLAY_TOKEN_SEPARATOR = /(?:[^\p{L}\p{N}'’]|(?<![\p{L}\p{N}])['’]|['’](?![\p{L}\p{N}]))+/u;

const cleanDescriptionTokens = (text: string, referenceTail: RegExp, numericToken: RegExp, separator: RegExp): string[] =>
    text
        .replace(referenceTail, '')
        .replaceAll(/\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu, ' ')
        .split(separator)
        .filter(token => isNotEmptyString(token) && !numericToken.test(token) && !LEGACY_STOP_TOKENS.has(token.toUpperCase()));
const RECENT_INTERVAL_COUNT = 4;
const RECENT_AMOUNT_COUNT = 3;
export const PRICE_CHANGE_RATIO = 0.05;
export const ACTIVE_PERIOD_RATIO = 1.5;

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const monthIndex = (timestamp: number): number => {
    const date = new Date(timestamp);

    return date.getFullYear() * 12 + date.getMonth();
};

export const description = (charge: RecurringChargeInterface): string => (isNotEmptyString(charge.title) ? charge.title : charge.comment);

export const counterpartyKey = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(charge.counterpartyIban)
        ? charge.counterpartyIban.replaceAll(/\s/gu, '').toUpperCase()
        : normalizeRecurringDescription(description(charge));

export const identity = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(counterpartyKey(charge)) ? `${charge.kind}|${charge.instrumentId}|${counterpartyKey(charge)}` : '';

export const legacyLabel = (charge: RecurringChargeInterface): string =>
    cleanDescriptionTokens(
        description(charge),
        /(MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO).*$/iu,
        /^\d+$|\d{3,}/u,
        IDENTITY_TOKEN_SEPARATOR
    )
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

export const nearestCycle = (anchor: Date, date: Date, cadence: RecurringCadenceInterface) => {
    const estimatedCycle = isDefined(cadence.periodMonths)
        ? Math.round((monthIndex(anchor.getTime()) - monthIndex(date.getTime())) / cadence.periodMonths)
        : Math.round(differenceInCalendarDays(anchor, date) / cadence.periodDays);

    return (isDefined(cadence.periodMonths) ? [estimatedCycle - 1, estimatedCycle, estimatedCycle + 1] : [estimatedCycle])
        .map(cycle => {
            const expected = isDefined(cadence.periodMonths)
                ? addMonths(anchor, -cycle * cadence.periodMonths)
                : addDays(anchor, -cycle * cadence.periodDays);

            return { cycle, deviation: Math.abs(differenceInCalendarDays(date, expected)) };
        })
        .reduce((closest, candidate) => (candidate.deviation < closest.deviation ? candidate : closest));
};

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

    const alignedCycles = events.map(event => nearestCycle(anchor, new Date(event.timestamp), cadence));

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
    const displayTokens = cleanDescriptionTokens(
        description(latest),
        /\b(?:MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO)\b.*$/iu,
        /^\d+$|\d{6,}/u,
        DISPLAY_TOKEN_SEPARATOR
    ).slice(0, 3);

    return {
        kind: latest.kind,
        instrumentId: latest.instrumentId,
        nativeAmount,
        merchantKey: identity(latest),
        labels: [...new Set([identity(latest), normalizeRecurringDescription(description(latest)), ...charges.map(legacyLabel)])],
        title: isNotEmptyArray(displayTokens) ? displayTokens.join(' ') : description(latest).trim().split(/\s+/u).slice(0, 3).join(' '),
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        ...cadence,
        anchorTimestamp: latestEvent.timestamp,
        predictedAmount: Math.round((nativeAmount * latestEvent.amount) / latestEvent.nativeAmount),
        priceChangedAt: priceChangeIndex > 0 ? events[priceChangeIndex].timestamp : null,
        events
    };
};

export const isSeriesActive = (series: RecurringSeriesInterface, now: Date): boolean =>
    differenceInCalendarDays(now, new Date(series.anchorTimestamp)) <= series.periodDays * ACTIVE_PERIOD_RATIO;

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
        .filter(series => isSeriesActive(series, new Date(latestTimestamp)))
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
    const groups = Arr.groupBy(
        charges.filter(charge => isNotEmptyString(identity(charge))),
        identity
    );
    const detected = Object.values(groups).flatMap(group => {
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

    return continueRecurringSeries(detected);
};
