import { isDefined } from '@rnw-community/shared';

const MAX_CACHE_SIZE = 64;
const DATE_TIME_FORMAT_CACHE = new Map<string, Intl.DateTimeFormat>();

export const getCachedDateTimeFormat = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
    const key = `${locale}|${JSON.stringify(options)}`;
    const cached = DATE_TIME_FORMAT_CACHE.get(key);

    if (isDefined(cached)) {
        return cached;
    }

    if (DATE_TIME_FORMAT_CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = DATE_TIME_FORMAT_CACHE.keys().next().value;

        if (isDefined(oldestKey)) {
            DATE_TIME_FORMAT_CACHE.delete(oldestKey);
        }
    }

    const formatter = new Intl.DateTimeFormat(locale, options);
    DATE_TIME_FORMAT_CACHE.set(key, formatter);

    return formatter;
};
