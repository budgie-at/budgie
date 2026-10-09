import type { RecurringCalendarEntryInterface } from '../interface/recurring-calendar-entry.interface';
import type { RecurringSeriesKindEnum } from '@budgie/contracts';

export const sumRecurringEntriesByKind = (entries: readonly RecurringCalendarEntryInterface[], kind: RecurringSeriesKindEnum): number =>
    entries.filter(entry => entry.kind === kind).reduce((total, entry) => total + entry.latestAmount, 0);
