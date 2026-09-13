import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringChargeCandidateInterface } from '@budgie/contracts';

const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 30.44;
const MIN_EVENTS = 3;
const MIN_MEDIAN_GAP_DAYS = 12;
const MAX_EVENTS_PER_MONTH = 2.5;
const MAX_ROBUST_GAP_CV = 0.8;
const SAME_EVENT_WINDOW_DAYS = 3;
const RECENT_AMOUNT_COUNT = 3;
const MAD_SCALE = 1.4826;
const MIN_FUZZY_LENGTH = 5;
const FUZZY_DICE_THRESHOLD = 0.72;
const PERIOD_MONTHS_TOLERANCE = 0.2;
const PERIOD_MONTHLY_DAYS = 30;
const PERIOD_BIMONTHLY_DAYS = 61;
const PERIOD_QUARTERLY_DAYS = 91;
const PERIOD_SEMIANNUAL_DAYS = 182;

const PERIOD_MONTHS: readonly (readonly [number, number])[] = [
    [1, PERIOD_MONTHLY_DAYS],
    [2, PERIOD_BIMONTHLY_DAYS],
    [3, PERIOD_QUARTERLY_DAYS],
    [6, PERIOD_SEMIANNUAL_DAYS]
];

const normalizeLabel = (value: string): string =>
    value
        .toUpperCase()
        .replace(/[^0-9A-ZА-ЯІЇЄҐ]+/gu, ' ')
        .split(' ')
        .filter(token => token.length >= 2 && !/^[0-9]+$/u.test(token))
        .join(' ')
        .trim();

const buildBigrams = (value: string): Set<string> => {
    const compact = value.replace(/ /gu, '');
    const bigrams = new Set<string>();
    for (let index = 0; index < compact.length - 1; index += 1) {
        bigrams.add(compact.slice(index, index + 2));
    }

    return bigrams;
};

const diceCoefficient = (first: string, second: string): number => {
    const firstBigrams = buildBigrams(first);
    const secondBigrams = buildBigrams(second);
    if (firstBigrams.size === 0 || secondBigrams.size === 0) {
        return 0;
    }
    let intersection = 0;
    for (const bigram of firstBigrams) {
        if (secondBigrams.has(bigram)) {
            intersection += 1;
        }
    }

    return (2 * intersection) / (firstBigrams.size + secondBigrams.size);
};

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[middle];
    }

    return (sorted[middle - 1] + sorted[middle]) / 2;
};

const robustGapCv = (gaps: readonly number[], medianGap: number): number => {
    if (isEmptyArray(gaps) || medianGap === 0) {
        return Number.POSITIVE_INFINITY;
    }

    return (MAD_SCALE * median(gaps.map(gap => Math.abs(gap - medianGap)))) / medianGap;
};

const resolvePeriodMonths = (medianGapDays: number): number | null => {
    for (const [months, days] of PERIOD_MONTHS) {
        if (Math.abs(medianGapDays - days) <= days * PERIOD_MONTHS_TOLERANCE) {
            return months;
        }
    }

    return null;
};

const toDayStart = (operatedAt: Date): number => new Date(operatedAt.getFullYear(), operatedAt.getMonth(), operatedAt.getDate()).getTime();

const buildEvents = (candidates: readonly RecurringChargeCandidateInterface[]): RecurringSeriesEventInterface[] => {
    const amountByDay = new Map<number, number>();
    const transactionByDay = new Map<number, number>();
    for (const candidate of candidates) {
        const dayStart = toDayStart(candidate.operatedAt);
        amountByDay.set(dayStart, (amountByDay.get(dayStart) ?? 0) + candidate.defaultAmount);
        transactionByDay.set(dayStart, Math.max(transactionByDay.get(dayStart) ?? 0, candidate.transactionId));
    }

    const events: RecurringSeriesEventInterface[] = [];
    for (const timestamp of [...amountByDay.keys()].sort((first, second) => first - second)) {
        const amount = amountByDay.get(timestamp) ?? 0;
        const transactionId = transactionByDay.get(timestamp) ?? 0;
        const previous = events[events.length - 1];
        const isSameEvent = isDefined(previous) && Math.round((timestamp - previous.timestamp) / DAY_MS) <= SAME_EVENT_WINDOW_DAYS;

        if (isSameEvent) {
            events[events.length - 1] = {
                timestamp: previous.timestamp,
                day: previous.day,
                amount: previous.amount + amount,
                transactionId: Math.max(previous.transactionId, transactionId)
            };
        } else {
            events.push({ timestamp, day: new Date(timestamp).getDate(), amount, transactionId });
        }
    }

    return events;
};

const buildSeries = (candidates: readonly RecurringChargeCandidateInterface[]): RecurringSeriesInterface | null => {
    const events = buildEvents(candidates);
    if (events.length < MIN_EVENTS) {
        return null;
    }

    const gaps = events.slice(1).map((event, index) => Math.round((event.timestamp - events[index].timestamp) / DAY_MS));
    const medianGap = median(gaps);
    const spanMonths = Math.max((events[events.length - 1].timestamp - events[0].timestamp) / DAY_MS / DAYS_PER_MONTH, 1);
    if (
        medianGap < MIN_MEDIAN_GAP_DAYS ||
        events.length / spanMonths > MAX_EVENTS_PER_MONTH ||
        robustGapCv(gaps, medianGap) > MAX_ROBUST_GAP_CV
    ) {
        return null;
    }

    const latest = candidates.reduce((current, candidate) =>
        candidate.operatedAt.getTime() > current.operatedAt.getTime() ? candidate : current
    );
    const recentAmounts = events.slice(-RECENT_AMOUNT_COUNT).map(event => event.amount);

    return {
        title: isNotEmptyString(latest.title) ? latest.title : latest.comment,
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        instrumentId: latest.instrumentId,
        periodMonths: resolvePeriodMonths(medianGap),
        periodDays: medianGap,
        anchorTimestamp: events[events.length - 1].timestamp,
        predictedAmount: Math.round(median(recentAmounts)),
        occurrenceCount: events.length,
        events
    };
};

const groupCandidatesByLabel = (
    candidates: readonly RecurringChargeCandidateInterface[]
): Map<string, RecurringChargeCandidateInterface[]> => {
    const groups = new Map<string, RecurringChargeCandidateInterface[]>();
    for (const candidate of candidates) {
        const label = normalizeLabel(isNotEmptyString(candidate.title) ? candidate.title : candidate.comment);
        if (isNotEmptyString(label)) {
            const existing = groups.get(label) ?? [];
            existing.push(candidate);
            groups.set(label, existing);
        }
    }

    return groups;
};

const mergeSimilarGroups = (groups: ReadonlyMap<string, RecurringChargeCandidateInterface[]>): RecurringChargeCandidateInterface[][] => {
    const mergedGroups: RecurringChargeCandidateInterface[][] = [];
    let currentKeys: string[] = [];

    for (const label of [...groups.keys()].sort()) {
        const previousLabel = currentKeys[currentKeys.length - 1];
        const canMerge =
            isDefined(previousLabel) &&
            previousLabel.length >= MIN_FUZZY_LENGTH &&
            label.length >= MIN_FUZZY_LENGTH &&
            diceCoefficient(previousLabel, label) >= FUZZY_DICE_THRESHOLD;

        if (isNotEmptyArray(currentKeys) && !canMerge) {
            mergedGroups.push(currentKeys.flatMap(key => groups.get(key) ?? []));
            currentKeys = [];
        }
        currentKeys.push(label);
    }

    if (isNotEmptyArray(currentKeys)) {
        mergedGroups.push(currentKeys.flatMap(key => groups.get(key) ?? []));
    }

    return mergedGroups;
};

export const detectRecurringSeries = (candidates: readonly RecurringChargeCandidateInterface[]): RecurringSeriesInterface[] => {
    const series: RecurringSeriesInterface[] = [];
    for (const group of mergeSimilarGroups(groupCandidatesByLabel(candidates))) {
        const detected = buildSeries(group);
        if (isDefined(detected)) {
            series.push(detected);
        }
    }

    return series;
};
