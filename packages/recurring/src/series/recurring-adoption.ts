import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { legacyLabel, nearestCycle } from './recurring-series';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

const LEGACY_PROCESSOR_PREFIX_PATTERN = /^(?:PAYPAL|PP|SQ|SQU|GOOGLE|SUMUP|ZETTLE|IZ)\s+/u;
const IBAN_SEGMENT_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/u;

const isQualifiedIdentity = (key: string): boolean => {
    const segments = key.split('|');

    return segments.length >= 4 && (/^\d+$/u.test(segments[2]) || /^\d+$/u.test(segments[3]));
};

const isNumericSegment = (segment: string | undefined): boolean => /^\d*$/u.test(segment ?? '');

const storedKeyVariants = (key: string): string[] => {
    const segments = key.split('|');
    const counterpartyIndex = segments.length >= 4 && isNumericSegment(segments[2]) ? 3 : 2;
    const counterparty = segments[counterpartyIndex];
    if (!isDefined(counterparty) || IBAN_SEGMENT_PATTERN.test(counterparty)) {
        return [key];
    }
    const normalized = normalizeRecurringDescription(counterparty);
    const unprefixed = normalized.replace(LEGACY_PROCESSOR_PREFIX_PATTERN, '');

    return [...new Set([normalized, unprefixed].filter(isNotEmptyString))].map(variant =>
        segments.map((segment, index) => (index === counterpartyIndex ? variant : segment)).join('|')
    );
};

const indexHistoricalCharges = (charges: readonly RecurringChargeInterface[]) => {
    const history = new Map<string, (readonly [number, number])[]>();
    for (const charge of charges) {
        const indexedCharge = [charge.transactionId, startOfDay(charge.operatedAt).getTime()] as const;
        for (const label of new Set([
            legacyLabel(charge),
            normalizeRecurringDescription(isNotEmptyString(charge.title) ? charge.title : charge.comment)
        ])) {
            const key = `${charge.kind}|${label}`;
            const matching = history.get(key) ?? [];
            matching.push(indexedCharge);
            history.set(key, matching);
        }
    }

    return history;
};

const matchesHistoricalCadence = (
    series: RecurringSeriesInterface,
    row: RecurringSeriesEntityInterface,
    charges: readonly (readonly [number, number])[]
): boolean => {
    if (!isDefined(series.periodMonths) || isQualifiedIdentity(row.merchantKey)) {
        return false;
    }
    const events = series.events.filter(event => differenceInCalendarDays(new Date(event.timestamp), row.lastSeenAt) <= 0);
    const savedDay = startOfDay(row.lastSeenAt).getTime();
    const history = charges.filter(([, day]) => day <= savedDay);
    const eventIds = new Set(events.map(event => event.transactionId));
    if (
        events.length < (series.periodMonths === 12 ? 2 : 3) ||
        history.length !== events.length ||
        !history.every(([transactionId]) => eventIds.has(transactionId)) ||
        differenceInCalendarDays(new Date(events[events.length - 1].timestamp), row.lastSeenAt) !== 0
    ) {
        return false;
    }
    const gaps = events
        .slice(1)
        .map((event, index) => differenceInCalendarDays(new Date(event.timestamp), new Date(events[index].timestamp)))
        .sort((first, second) => first - second);
    const middle = Math.floor(gaps.length / 2);

    return (
        row.periodDays === Math.round(gaps.length % 2 === 1 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2) &&
        events.slice(1).every((event, index) => {
            const cycle = nearestCycle(new Date(event.timestamp), new Date(events[index].timestamp), series);

            return cycle.cycle === 1 && cycle.deviation <= series.toleranceDays;
        })
    );
};

const createCycleMatcher = (charges: readonly RecurringChargeInterface[]) => {
    let historicalIndex: ReturnType<typeof indexHistoricalCharges> | undefined;
    const matchingHistory = new Map<RecurringSeriesInterface, (readonly [number, number])[]>();
    const cycleMatches = new Map<RecurringSeriesInterface, Map<number, boolean>>();
    const getHistory = (series: RecurringSeriesInterface) => {
        let history = matchingHistory.get(series);
        if (!isDefined(history)) {
            historicalIndex ??= indexHistoricalCharges(charges);
            history = [...new Set(series.labels.flatMap(label => historicalIndex?.get(`${series.kind}|${label}`) ?? []))];
            matchingHistory.set(series, history);
        }

        return history;
    };

    return (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): boolean => {
        const matches = cycleMatches.get(series) ?? new Map<number, boolean>();
        const cached = matches.get(row.id);
        if (isDefined(cached)) {
            return cached;
        }
        const result =
            row.kind === series.kind &&
            (row.periodDays === Math.round(series.periodDays) ||
                (!isQualifiedIdentity(row.merchantKey) &&
                    isDefined(series.periodMonths) &&
                    matchesHistoricalCadence(series, row, getHistory(series)))) &&
            nearestCycle(new Date(series.anchorTimestamp), row.lastSeenAt, series).deviation <= series.toleranceDays;
        matches.set(row.id, result);
        cycleMatches.set(series, matches);

        return result;
    };
};

const canonicalFamily = (key: string): string => {
    const segments = key.split('|');

    return /^\d*$/u.test(segments[2] ?? '') && segments.length >= 4
        ? [segments[0], segments[1], segments[3]].join('|')
        : segments.slice(0, 3).join('|');
};

const matchesUnbandedIdentity = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): boolean =>
    !isQualifiedIdentity(row.merchantKey) &&
    series.kind === row.kind &&
    (row.merchantKey.includes('|')
        ? canonicalFamily(row.merchantKey) === canonicalFamily(series.merchantKey)
        : series.labels.includes(row.merchantKey) || series.labels.includes(normalizeRecurringDescription(row.merchantKey)));

const amountGap = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): number =>
    Math.abs(row.amount - series.nativeAmount);

export const resolveKeyedRows = (
    detected: readonly RecurringSeriesInterface[],
    storedRows: readonly RecurringSeriesEntityInterface[],
    historicalCharges: readonly RecurringChargeInterface[],
    zeroLinkRowIds: ReadonlySet<number>
): (RecurringSeriesEntityInterface | null)[] => {
    const rows = storedRows.flatMap(row => storedKeyVariants(row.merchantKey).map(merchantKey => ({ ...row, merchantKey })));
    const exactRows = detected.map(series =>
        rows.find(
            item =>
                item.kind === series.kind && item.merchantKey === series.merchantKey && item.periodDays === Math.round(series.periodDays)
        )
    );
    const claimed = new Set(exactRows.filter(isDefined).map(item => item.id));
    const matchesCycle = createCycleMatcher(historicalCharges);

    const qualifiedCandidates = detected.map((series, index) =>
        isDefined(exactRows[index])
            ? []
            : rows
                  .filter(
                      item =>
                          !claimed.has(item.id) &&
                          isQualifiedIdentity(item.merchantKey) &&
                          canonicalFamily(item.merchantKey) === canonicalFamily(series.merchantKey) &&
                          matchesCycle(series, item)
                  )
                  .filter((item, itemIndex, items) => items.findIndex(candidate => candidate.id === item.id) === itemIndex)
                  .sort((first, second) => amountGap(series, first) - amountGap(series, second))
    );
    const qualifiedRows = qualifiedCandidates.map(([best, runnerUp], index) => {
        if (
            !isDefined(best) ||
            (isDefined(runnerUp) && amountGap(detected[index], runnerUp) === amountGap(detected[index], best)) ||
            qualifiedCandidates.some(
                (candidates, candidateIndex) =>
                    candidateIndex !== index &&
                    candidates.includes(best) &&
                    amountGap(detected[candidateIndex], best) <= amountGap(detected[index], best)
            )
        ) {
            return null;
        }

        return best;
    });
    for (const row of qualifiedRows.filter(isDefined)) {
        claimed.add(row.id);
    }

    const storedById = new Map(storedRows.map(row => [row.id, row]));

    return detected.map((series, index) => {
        const qualifiedRow = exactRows[index] ?? qualifiedRows[index];
        const unbandedRows = isDefined(qualifiedRow)
            ? []
            : rows.filter(
                  item =>
                      zeroLinkRowIds.has(item.id) &&
                      !claimed.has(item.id) &&
                      matchesUnbandedIdentity(series, item) &&
                      matchesCycle(series, item)
              );
        const row =
            qualifiedRow ??
            unbandedRows.find(
                item =>
                    unbandedRows.length === 1 &&
                    detected.filter(candidate => matchesUnbandedIdentity(candidate, item) && matchesCycle(candidate, item)).length === 1
            ) ??
            null;
        if (isDefined(row)) {
            claimed.add(row.id);
        }

        return isDefined(row) ? (storedById.get(row.id) ?? null) : null;
    });
};
