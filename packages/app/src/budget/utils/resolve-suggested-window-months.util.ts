import { addMonths, getMonth, getYear } from 'date-fns';

interface DatedEntryInterface {
    readonly operatedAt: Date;
}

const buildMonthKey = (date: Date): string => `${getYear(date)}-${getMonth(date)}`;

export const resolveSuggestedWindowMonths = (
    entries: readonly DatedEntryInterface[],
    windowStart: Date,
    maxMonths: number,
    minEntriesPerMonth: number
): number => {
    const countsByMonth = new Map<string, number>();

    for (const entry of entries) {
        const key = buildMonthKey(entry.operatedAt);
        countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
    }

    let months = 0;

    for (let offset = maxMonths - 1; offset >= 0; offset -= 1) {
        const monthKey = buildMonthKey(addMonths(windowStart, offset));

        if ((countsByMonth.get(monthKey) ?? 0) < minEntriesPerMonth) {
            break;
        }

        months += 1;
    }

    return months;
};
