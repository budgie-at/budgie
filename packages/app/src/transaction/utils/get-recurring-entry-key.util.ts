import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';

export const getRecurringEntryKey = (
    entry: Pick<RecurringCalendarEntryInterface, 'categoryId' | 'accountId' | 'title' | 'latestAmount' | 'isForecast' | 'dayOfMonth'>
): string =>
    `${entry.categoryId}-${entry.accountId}-${entry.title}-${entry.latestAmount}-${entry.isForecast ? 'f' : 'a'}-${entry.dayOfMonth}`;
