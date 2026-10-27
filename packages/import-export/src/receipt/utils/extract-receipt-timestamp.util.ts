import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { ReceiptTimestampInterface } from '../interface/receipt-timestamp.interface';

const ISO_DATE_PATTERN = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/u;
const DAY_FIRST_DATE_PATTERN = /(?<!\d)(\d{1,2})[./](\d{1,2})[./](\d{4})(?!\d)/u;
const TIME_PATTERN = /(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s?([AaPp])\.?[Mm]\.?)?(?![\d:])/u;
const MONTHS_IN_YEAR = 12;
const HOURS_IN_HALF_DAY = 12;

const buildDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

const findDate = (text: string): Date | null => {
    const isoMatch = ISO_DATE_PATTERN.exec(text);

    if (isDefined(isoMatch)) {
        return buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const dayFirstMatch = DAY_FIRST_DATE_PATTERN.exec(text);

    if (!isDefined(dayFirstMatch)) {
        return null;
    }

    const [, first, second, year] = dayFirstMatch.map(Number);

    return second > MONTHS_IN_YEAR ? buildDate(year, first, second) : buildDate(year, second, first);
};

const toHour = (hours: string, meridiem: string): number => {
    if (!isNotEmptyString(meridiem)) {
        return Number(hours);
    }

    return (Number(hours) % HOURS_IN_HALF_DAY) + (meridiem.toUpperCase() === 'P' ? HOURS_IN_HALF_DAY : 0);
};

const withTime = (date: Date, text: string): Date | null => {
    const timeMatch = TIME_PATTERN.exec(text);

    if (!isDefined(timeMatch)) {
        return null;
    }

    const [, hours, minutes, seconds, meridiem] = timeMatch;

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        toHour(hours, meridiem),
        Number(minutes),
        isNotEmptyString(seconds) ? Number(seconds) : 0
    );
};

const findTimestamp = (text: string): ReceiptTimestampInterface | null => {
    const date = findDate(text);

    if (!isDefined(date)) {
        return null;
    }

    const dateTime = withTime(date, text);

    return isDefined(dateTime) ? { occurredAt: dateTime, hasTime: true } : { occurredAt: date, hasTime: false };
};

export const extractReceiptTimestamp = (rows: readonly string[], paymentRows: readonly string[]): ReceiptTimestampInterface | null =>
    [...paymentRows, ...rows].map(findTimestamp).find(isDefined) ?? null;
