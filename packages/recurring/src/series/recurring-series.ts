import { PRECISION } from '@budgie/contracts';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { RecurringCalendarDataInterface } from '../interface/recurring-calendar-data.interface';
import type { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';
import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

const DAY_MS = 86_400_000;
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
const PERIOD_MONTHS: readonly number[] = [1, 2, 3, 6];

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

const PROJECTION_SUPPRESSION_RATIO = 0.4;
const ACTIVE_PERIOD_RATIO = 1.5;
const ACTIVE_GRACE_DAYS = 5;

const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const monthIndex = (timestamp: number): number => {
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
        const label = cleanTokens(charge).join(' ').toUpperCase();
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

const buildSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface | null => {
    const events = toEvents(charges);
    const medianGap = events.length < MIN_EVENTS ? null : measureMedianGap(events);
    if (!isDefined(medianGap)) {
        return null;
    }

    const latest = charges.reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const periodMonths = PERIOD_MONTHS.find(
        months => Math.abs(medianGap - months * DAYS_PER_MONTH) <= months * DAYS_PER_MONTH * PERIOD_TOLERANCE
    );

    return {
        title: cleanTokens(latest).slice(0, DISPLAY_TOKEN_COUNT).join(' '),
        categoryId: latest.categoryId,
        categoryTitle: latest.categoryTitle,
        categoryIcon: latest.categoryIcon,
        accountId: latest.accountId,
        periodMonths: periodMonths ?? null,
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

const expectedDays = (series: RecurringSeriesInterface, year: number, month: number): number[] => {
    if (isDefined(series.periodMonths)) {
        const monthsFromAnchor = year * MONTHS_PER_YEAR + month - monthIndex(series.anchorTimestamp);

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

const toEntry = (
    series: RecurringSeriesInterface,
    dayOfMonth: number,
    latestAmount: number,
    latestTransactionId: number | null
): RecurringCalendarEntryInterface => {
    const isForecast = !isDefined(latestTransactionId);

    return {
        key: `${series.categoryId}-${series.accountId}-${series.title}-${latestAmount}-${isForecast ? 'f' : 'a'}-${dayOfMonth}`,
        title: series.title,
        categoryId: series.categoryId,
        categoryTitle: series.categoryTitle,
        categoryIcon: series.categoryIcon,
        accountId: series.accountId,
        latestAmount,
        latestTransactionId,
        dayOfMonth,
        isForecast
    };
};

const projectSeries = (series: RecurringSeriesInterface, year: number, month: number, now: Date): RecurringCalendarEntryInterface[] => {
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 1).getTime();
    const monthsFromNow = year * MONTHS_PER_YEAR + month - monthIndex(now.getTime());
    const actuals = series.events
        .filter(event => event.timestamp >= monthStart && event.timestamp < monthEnd)
        .map(event => toEntry(series, new Date(event.timestamp).getDate(), event.amount, event.transactionId));
    const isActive = now.getTime() - series.anchorTimestamp <= (series.periodDays * ACTIVE_PERIOD_RATIO + ACTIVE_GRACE_DAYS) * DAY_MS;
    const forecasts =
        monthsFromNow >= 0 && isActive
            ? expectedDays(series, year, month)
                  .filter(day => monthsFromNow > 0 || day > now.getDate())
                  .filter(day =>
                      actuals.every(actual => Math.abs(actual.dayOfMonth - day) > series.periodDays * PROJECTION_SUPPRESSION_RATIO)
                  )
                  .map(day => toEntry(series, day, series.predictedAmount, null))
            : [];

    return [...actuals, ...forecasts];
};

const groupByDay = (entries: readonly RecurringCalendarEntryInterface[]): Map<number, RecurringCalendarEntryInterface[]> =>
    entries.reduce(
        (groups, entry) => groups.set(entry.dayOfMonth, [...(groups.get(entry.dayOfMonth) ?? []), entry]),
        new Map<number, RecurringCalendarEntryInterface[]>()
    );

const sumExpenses = (entries: readonly RecurringCalendarEntryInterface[]): number =>
    entries.reduce((total, entry) => total + Math.max(entry.latestAmount, 0), 0) / PRECISION;

export const projectRecurringMonth = (
    series: readonly RecurringSeriesInterface[],
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
        forecastedTotalAmount: sumExpenses(forecasts)
    };
};
