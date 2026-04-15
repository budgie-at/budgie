import { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry-interface.type';

export const getRecurringEntryKey = (
    entry: Pick<RecurringCalendarEntryInterface, 'categoryId' | 'accountId' | 'latestAmount' | 'isForecast'>
): string => `${entry.categoryId}-${entry.accountId}-${entry.latestAmount}-${entry.isForecast ? 'f' : 'a'}`;
