import type { RecurringCalendarEntryInterface } from './recurring-calendar-entry.interface';

export interface RecurringCalendarAccumulatorInterface {
    readonly entriesByDay: Map<number, RecurringCalendarEntryInterface[]>;
    readonly forecastedEntriesByDay: Map<number, RecurringCalendarEntryInterface[]>;
    readonly isCurrentMonth: boolean;
    readonly today: number;
    readonly daysInMonth: number;
    totalAmount: number;
    forecastedTotalAmount: number;
}
