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
const MONTHS_PER_YEAR = 12;
const MAD_SCALE = 1.4826;
const MIN_FUZZY_LENGTH = 5;
const FUZZY_DICE_THRESHOLD = 0.85;
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

const NOISE_TAIL_PATTERN = /(MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO)/iu;
const AUSTRIAN_LEGAL_PATTERN = /\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,}\b/giu;
const LONG_DIGIT_RUN_PATTERN = /\d{3,}/u;
const STOP_TOKENS: ReadonlySet<string> = new Set([
    'GMBH',
    'AG',
    'KG',
    'CO',
    'INC',
    'LTD',
    'LLC',
    'OG',
    'ФОП',
    'ТОВ',
    'ПП',
    'ПАТ',
    'АТ',
    'ВІД'
]);
const DISPLAY_TOKEN_COUNT = 3;
const BAND_MAX_RATIO = 1.2;
const BAND_SPLIT_PERIOD_MONTHS = 1;
const MIN_PREFIX_TOKENS = 2;
const MONTHLY_MAX_GAP_DAYS = 45;
const MIN_MONTH_PRESENCE = 0.75;

const cleanTokens = (value: string): string[] => {
    const tailIndex = value.search(NOISE_TAIL_PATTERN);
    const head = tailIndex > 0 ? value.slice(0, tailIndex) : value;

    return head
        .replace(AUSTRIAN_LEGAL_PATTERN, ' ')
        .replace(IBAN_PATTERN, ' ')
        .split(/[^\p{L}\p{N}]+/u)
        .filter(
            token =>
                isNotEmptyString(token) &&
                !/^\d+$/u.test(token) &&
                !LONG_DIGIT_RUN_PATTERN.test(token) &&
                !STOP_TOKENS.has(token.toUpperCase())
        );
};

const resolveRawLabel = (candidate: RecurringChargeCandidateInterface): string =>
    isNotEmptyString(candidate.title) ? candidate.title : candidate.comment;

const buildBigrams = (value: string): Set<string> => {
    const compact = value.replace(/ /gu, '');
    const bigrams = new Set<string>();
    for (let index = 0; index < compact.length - 1; index += 1) {
        bigrams.add(compact.slice(index, index + 2));
    }

    return bigrams;
};

const diceCoefficient = (firstBigrams: ReadonlySet<string>, secondBigrams: ReadonlySet<string>): number => {
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
    const events: RecurringSeriesEventInterface[] = [];
    for (const candidate of [...candidates].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime())) {
        const timestamp = toDayStart(candidate.operatedAt);
        const previous = events[events.length - 1];
        if (isDefined(previous) && Math.round((timestamp - previous.timestamp) / DAY_MS) <= SAME_EVENT_WINDOW_DAYS) {
            events[events.length - 1] = {
                ...previous,
                amount: previous.amount + candidate.defaultAmount,
                transactionId: Math.max(previous.transactionId, candidate.transactionId)
            };
        } else {
            events.push({
                timestamp,
                day: new Date(timestamp).getDate(),
                amount: candidate.defaultAmount,
                transactionId: candidate.transactionId
            });
        }
    }

    return events;
};

const hasMonthPresence = (events: readonly RecurringSeriesEventInterface[]): boolean => {
    const monthIndexes = events.map(
        event => new Date(event.timestamp).getFullYear() * MONTHS_PER_YEAR + new Date(event.timestamp).getMonth()
    );
    const calendarSpan = monthIndexes[monthIndexes.length - 1] - monthIndexes[0] + 1;

    return new Set(monthIndexes).size / calendarSpan >= MIN_MONTH_PRESENCE;
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
        robustGapCv(gaps, medianGap) > MAX_ROBUST_GAP_CV ||
        (medianGap < MONTHLY_MAX_GAP_DAYS && !hasMonthPresence(events))
    ) {
        return null;
    }

    const latest = candidates.reduce((current, candidate) =>
        candidate.operatedAt.getTime() > current.operatedAt.getTime() ? candidate : current
    );

    return {
        title: cleanTokens(resolveRawLabel(latest)).slice(0, DISPLAY_TOKEN_COUNT).join(' '),
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        periodMonths: resolvePeriodMonths(medianGap),
        periodDays: medianGap,
        anchorTimestamp: events[events.length - 1].timestamp,
        predictedAmount: Math.round(median(events.slice(-RECENT_AMOUNT_COUNT).map(event => event.amount))),
        events
    };
};

const groupCandidatesByLabel = (
    candidates: readonly RecurringChargeCandidateInterface[]
): Map<string, RecurringChargeCandidateInterface[]> => {
    const groups = new Map<string, RecurringChargeCandidateInterface[]>();
    for (const candidate of candidates) {
        const label = cleanTokens(resolveRawLabel(candidate)).join(' ').toUpperCase();
        if (isNotEmptyString(label)) {
            const existing = groups.get(label) ?? [];
            existing.push(candidate);
            groups.set(label, existing);
        }
    }

    return groups;
};

const isTokenPrefix = (prefix: string, label: string): boolean =>
    prefix.split(' ').length >= MIN_PREFIX_TOKENS && label.startsWith(`${prefix} `);

const areSimilarLabels = (first: string, second: string): boolean =>
    first.length >= MIN_FUZZY_LENGTH &&
    second.length >= MIN_FUZZY_LENGTH &&
    (diceCoefficient(buildBigrams(first), buildBigrams(second)) >= FUZZY_DICE_THRESHOLD ||
        isTokenPrefix(first, second) ||
        isTokenPrefix(second, first));

const mergeSimilarGroups = (groups: ReadonlyMap<string, RecurringChargeCandidateInterface[]>): RecurringChargeCandidateInterface[][] => {
    let clusters: string[][] = [];
    for (const label of groups.keys()) {
        const linked = clusters.filter(cluster => cluster.some(member => areSimilarLabels(member, label)));
        clusters = [...clusters.filter(cluster => !linked.includes(cluster)), [label, ...linked.flat()]];
    }

    return clusters.map(cluster => cluster.flatMap(label => groups.get(label) ?? []));
};

const splitIntoAmountBands = (group: readonly RecurringChargeCandidateInterface[]): RecurringChargeCandidateInterface[][] => {
    const sorted = [...group].sort((first, second) => Math.abs(first.defaultAmount) - Math.abs(second.defaultAmount));
    const bands: RecurringChargeCandidateInterface[][] = [];
    for (const candidate of sorted) {
        const band = bands[bands.length - 1];
        if (isDefined(band) && Math.abs(candidate.defaultAmount) <= Math.abs(band[0].defaultAmount) * BAND_MAX_RATIO) {
            band.push(candidate);
        } else {
            bands.push([candidate]);
        }
    }

    return bands;
};

const detectGroupSeries = (group: readonly RecurringChargeCandidateInterface[]): RecurringSeriesInterface[] => {
    const whole = buildSeries(group);
    const monthlyBandSeries = splitIntoAmountBands(group)
        .map(band => buildSeries(band))
        .filter(isDefined)
        .filter(series => series.periodMonths === BAND_SPLIT_PERIOD_MONTHS);

    if (monthlyBandSeries.length > 1 || (!isDefined(whole) && isNotEmptyArray(monthlyBandSeries))) {
        return monthlyBandSeries;
    }

    return isDefined(whole) ? [whole] : [];
};

export const detectRecurringSeries = (candidates: readonly RecurringChargeCandidateInterface[]): RecurringSeriesInterface[] => {
    const series: RecurringSeriesInterface[] = [];
    const incomeCandidates = candidates.filter(candidate => candidate.defaultAmount < 0);
    const expenseCandidates = candidates.filter(candidate => candidate.defaultAmount >= 0);
    for (const sideCandidates of [expenseCandidates, incomeCandidates]) {
        for (const group of mergeSimilarGroups(groupCandidatesByLabel(sideCandidates))) {
            series.push(...detectGroupSeries(group));
        }
    }

    return series;
};
