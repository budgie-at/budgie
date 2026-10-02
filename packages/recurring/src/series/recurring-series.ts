import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

export const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 30.44;
const MONTHS_PER_YEAR = 12;
const MAD_SCALE = 1.4826;

const MIN_EVENTS = 3;
const MIN_MEDIAN_GAP_DAYS = 12;
const MAX_EVENTS_PER_MONTH = 2.5;
const MAX_GAP_SPREAD = 0.8;
const SAME_EVENT_WINDOW_DAYS = 3;
const MONTHLY_MAX_GAP_DAYS = 45;
const MIN_MONTH_PRESENCE = 0.75;
const RECENT_AMOUNT_COUNT = 3;
const PERIOD_TOLERANCE = 0.2;
const MONTHLY_DAYS = 30;
const BIMONTHLY_DAYS = 61;
const QUARTERLY_DAYS = 91;
const SEMIANNUAL_DAYS = 182;
const PERIOD_DAYS_BY_MONTHS: readonly (readonly [number, number])[] = [
    [1, MONTHLY_DAYS],
    [2, BIMONTHLY_DAYS],
    [3, QUARTERLY_DAYS],
    [6, SEMIANNUAL_DAYS]
];

const BAND_MAX_RATIO = 1.2;
const MIN_FUZZY_LENGTH = 5;
const FUZZY_DICE_THRESHOLD = 0.85;
const MIN_PREFIX_TOKENS = 2;
const DISPLAY_TOKEN_COUNT = 3;
const NOISE_TAIL_PATTERN = /(MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO)/iu;
const LEGAL_FORM_PATTERN = /\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,}\b/giu;
const NUMERIC_TOKEN_PATTERN = /^\d+$|\d{3,}/u;
const STOP_TOKENS: ReadonlySet<string> = new Set('GMBH AG KG CO INC LTD LLC OG ФОП ТОВ ПП ПАТ АТ ВІД'.split(' '));

const ACTIVE_PERIOD_RATIO = 1.5;
const ACTIVE_GRACE_DAYS = 5;

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const monthIndex = (timestamp: number): number => {
    const date = new Date(timestamp);

    return date.getFullYear() * MONTHS_PER_YEAR + date.getMonth();
};

const cleanTokens = (charge: RecurringChargeInterface): string[] => {
    const raw = isNotEmptyString(charge.title) ? charge.title : charge.comment;
    const tailIndex = raw.search(NOISE_TAIL_PATTERN);

    return (tailIndex > 0 ? raw.slice(0, tailIndex) : raw)
        .replace(LEGAL_FORM_PATTERN, ' ')
        .replace(IBAN_PATTERN, ' ')
        .split(/[^\p{L}\p{N}]+/u)
        .filter(token => isNotEmptyString(token) && !NUMERIC_TOKEN_PATTERN.test(token) && !STOP_TOKENS.has(token.toUpperCase()));
};

const chargeLabel = (charge: RecurringChargeInterface): string => cleanTokens(charge).join(' ').toUpperCase();

const bigrams = (label: string): Set<string> => {
    const compact = label.replace(/ /gu, '');

    return new Set(Array.from({ length: Math.max(compact.length - 1, 0) }, (_, index) => compact.slice(index, index + 2)));
};

const areSimilarLabels = (first: string, second: string): boolean => {
    const isPrefix = (prefix: string, label: string): boolean =>
        prefix.split(' ').length >= MIN_PREFIX_TOKENS && label.startsWith(`${prefix} `);
    const firstBigrams = bigrams(first);
    const secondBigrams = bigrams(second);
    const shared = [...firstBigrams].filter(bigram => secondBigrams.has(bigram)).length;
    const dice = (2 * shared) / (firstBigrams.size + secondBigrams.size);

    return (
        first.length >= MIN_FUZZY_LENGTH &&
        second.length >= MIN_FUZZY_LENGTH &&
        (dice >= FUZZY_DICE_THRESHOLD || isPrefix(first, second) || isPrefix(second, first))
    );
};

const groupSimilarLabels = (charges: readonly RecurringChargeInterface[]): RecurringChargeInterface[][] => {
    const chargesByLabel = new Map<string, RecurringChargeInterface[]>();
    for (const charge of charges) {
        const label = chargeLabel(charge);
        if (isNotEmptyString(label)) {
            chargesByLabel.set(label, [...(chargesByLabel.get(label) ?? []), charge]);
        }
    }

    let clusters: string[][] = [];
    for (const label of chargesByLabel.keys()) {
        const linked = clusters.filter(cluster => cluster.some(member => areSimilarLabels(member, label)));
        clusters = [...clusters.filter(cluster => !linked.includes(cluster)), [label, ...linked.flat()]];
    }

    return clusters.map(cluster => cluster.flatMap(label => chargesByLabel.get(label) ?? []));
};

const splitIntoAmountBands = (charges: readonly RecurringChargeInterface[]): RecurringChargeInterface[][] => {
    const bands: RecurringChargeInterface[][] = [];
    for (const charge of [...charges].sort((first, second) => Math.abs(first.defaultAmount) - Math.abs(second.defaultAmount))) {
        const band = bands[bands.length - 1];
        if (isDefined(band) && Math.abs(charge.defaultAmount) <= Math.abs(band[0].defaultAmount) * BAND_MAX_RATIO) {
            band.push(charge);
        } else {
            bands.push([charge]);
        }
    }

    return bands;
};

const toEvents = (charges: readonly RecurringChargeInterface[]): RecurringSeriesEventInterface[] => {
    const events: RecurringSeriesEventInterface[] = [];
    for (const charge of [...charges].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime())) {
        const timestamp = new Date(charge.operatedAt.getFullYear(), charge.operatedAt.getMonth(), charge.operatedAt.getDate()).getTime();
        const previous = events[events.length - 1];
        if (isDefined(previous) && Math.round((timestamp - previous.timestamp) / DAY_MS) <= SAME_EVENT_WINDOW_DAYS) {
            events[events.length - 1] = {
                ...previous,
                amount: previous.amount + charge.defaultAmount,
                transactionId: Math.max(previous.transactionId, charge.transactionId)
            };
        } else {
            events.push({ timestamp, amount: charge.defaultAmount, transactionId: charge.transactionId });
        }
    }

    return events;
};

const measureMedianGap = (events: readonly RecurringSeriesEventInterface[]): number | null => {
    const gaps = events.slice(1).map((event, index) => Math.round((event.timestamp - events[index].timestamp) / DAY_MS));
    const medianGap = median(gaps);
    const gapSpread = (MAD_SCALE * median(gaps.map(gap => Math.abs(gap - medianGap)))) / medianGap;
    const spanMonths = Math.max((events[events.length - 1].timestamp - events[0].timestamp) / DAY_MS / DAYS_PER_MONTH, 1);
    const calendarMonths = monthIndex(events[events.length - 1].timestamp) - monthIndex(events[0].timestamp) + 1;
    const monthPresence = new Set(events.map(event => monthIndex(event.timestamp))).size / calendarMonths;
    const isRegular =
        medianGap >= MIN_MEDIAN_GAP_DAYS &&
        events.length / spanMonths <= MAX_EVENTS_PER_MONTH &&
        gapSpread <= MAX_GAP_SPREAD &&
        (medianGap >= MONTHLY_MAX_GAP_DAYS || monthPresence >= MIN_MONTH_PRESENCE);

    return isRegular ? medianGap : null;
};

const findMerchantKey = (labels: readonly string[]): string => {
    const counts = labels.reduce((result, label) => result.set(label, (result.get(label) ?? 0) + 1), new Map<string, number>());

    return [...counts.entries()].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
};

const buildSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface | null => {
    const events = toEvents(charges);
    const medianGap = events.length < MIN_EVENTS ? null : measureMedianGap(events);
    if (!isDefined(medianGap)) {
        return null;
    }

    const latest = charges.reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const period = PERIOD_DAYS_BY_MONTHS.find(([, days]) => Math.abs(medianGap - days) <= days * PERIOD_TOLERANCE);
    const labels = charges.map(chargeLabel);

    return {
        merchantKey: findMerchantKey(labels),
        labels: [...new Set(labels)],
        title: cleanTokens(latest).slice(0, DISPLAY_TOKEN_COUNT).join(' '),
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        periodMonths: period?.[0] ?? null,
        periodDays: medianGap,
        anchorTimestamp: events[events.length - 1].timestamp,
        predictedAmount: Math.round(median(events.slice(-RECENT_AMOUNT_COUNT).map(event => event.amount))),
        events
    };
};

const detectMerchantSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const whole = buildSeries(charges);
    const monthlyBands = splitIntoAmountBands(charges)
        .map(band => buildSeries(band))
        .filter(isDefined)
        .filter(series => series.periodMonths === 1);

    if (monthlyBands.length > 1 || (!isDefined(whole) && isNotEmptyArray(monthlyBands))) {
        return monthlyBands;
    }

    return isDefined(whole) ? [whole] : [];
};

export const detectRecurringSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] =>
    [charges.filter(charge => charge.defaultAmount >= 0), charges.filter(charge => charge.defaultAmount < 0)].flatMap(sideCharges =>
        groupSimilarLabels(sideCharges).flatMap(detectMerchantSeries)
    );

export const isSeriesActive = (series: RecurringSeriesInterface, now: Date): boolean =>
    now.getTime() - series.anchorTimestamp <= (series.periodDays * ACTIVE_PERIOD_RATIO + ACTIVE_GRACE_DAYS) * DAY_MS;
