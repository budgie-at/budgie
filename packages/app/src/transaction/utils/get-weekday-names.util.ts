const DAYS_IN_WEEK = 7;
const MONDAY_OFFSET = 6;
const MONDAY_REFERENCE_YEAR = 2025;

export const getWeekdayNames = (locale: string): string[] =>
    Array.from({ length: DAYS_IN_WEEK }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(MONDAY_REFERENCE_YEAR, 0, MONDAY_OFFSET + i))
    );
